import { createContext, useContext, useRef, useCallback } from "react";

interface ScrollTargetEntry {
  id: string;
  el?: HTMLElement | null;
}

interface ScrollTargetsContextValue {
  register?: (id: string, el: HTMLElement | null) => void;
  unregister?: (id: string) => void;
  scrollTo?: (id: string, options?: ScrollIntoViewOptions) => void;
  reset?: (entries?: ScrollTargetEntry[]) => void;
}

const ScrollTargetsContext = createContext<ScrollTargetsContextValue>({});

export function ScrollTargetsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const targets = useRef<Record<string, HTMLElement | null>>({});

  const register = useCallback((id: string, el: HTMLElement | null) => {
    targets.current[id] = el;
  }, []);

  const unregister = useCallback((id: string) => {
    delete targets.current[id];
  }, []);

  const scrollTo = useCallback(
    (id: string, options?: ScrollIntoViewOptions) => {
      targets.current[id]?.scrollIntoView(
        options ?? { behavior: "smooth", block: "center" },
      );
    },
    [],
  );

  const reset = useCallback((entries?: ScrollTargetEntry[]) => {
    // Clear every previously registered target first
    targets.current = {};

    // Seed the new list; elements not yet mounted default to null
    // and will be filled in by each item's own ref callback on mount.
    if (entries) {
      for (const { id, el } of entries) {
        targets.current[id] = el ?? null;
      }
    }
  }, []);

  return (
    <ScrollTargetsContext.Provider
      value={{ register, unregister, scrollTo, reset }}
    >
      {children}
    </ScrollTargetsContext.Provider>
  );
}

export function useScrollTargets() {
  const ctx = useContext(ScrollTargetsContext);
  return ctx;
}

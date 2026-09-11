import { useTranslations } from "next-intl";
import { ActionDispatch, createContext, useContext, useReducer } from "react";
import GlobalLoading from "../custom/loader/GlobalLoading";

interface ContextData {
  isLoading: boolean;
  text: string;
}

interface Payload {
  type: "show" | "hide";
}

const GlobalLoadingContext = createContext<ContextData | null>(null);

const GlobalLoadingDispatchContext = createContext<ActionDispatch<
  [action: Payload]
> | null>(null);

function reducer(ctx: ContextData, action: Payload) {
  switch (action.type) {
    case "show":
      return {
        isLoading: true,
        text: ctx.text,
      };
    default:
      return {
        isLoading: false,
        text: ctx.text,
      };
  }
}

export function useLoader() {
  return useContext(GlobalLoadingContext);
}

export function useLoaderDispatch() {
  return useContext(GlobalLoadingDispatchContext);
}

export default function GlobalLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("/");
  const [ctx, dispatch] = useReducer(reducer, {
    isLoading: false,
    text: t("loading"),
  });

  return (
    <GlobalLoadingContext value={ctx}>
      <GlobalLoadingDispatchContext value={dispatch}>
        {children}
        <GlobalLoading open={ctx.isLoading} />
      </GlobalLoadingDispatchContext>
    </GlobalLoadingContext>
  );
}

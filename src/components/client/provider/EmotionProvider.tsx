"use client";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";

const muiCache = createCache({ key: "mui", prepend: true });

export function EmotionProvider({ children }: { children: React.ReactNode }) {
  return <CacheProvider value={muiCache}>{children}</CacheProvider>;
}

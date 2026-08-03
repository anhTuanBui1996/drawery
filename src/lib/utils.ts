import { routing } from "@/src/i18n/routing";

const countryMapping = {
  vi: "VN",
  en: "US",
};

function getLocaleFromPathname(pathname: string) {
  const [, maybeLocale] = pathname.split("/");
  return routing.locales.includes(maybeLocale as any)
    ? maybeLocale
    : routing.defaultLocale;
}

export { getLocaleFromPathname, countryMapping };

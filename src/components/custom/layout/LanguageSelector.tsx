"use client";

import { MenuItem, Select, SelectChangeEvent, Typography } from "@mui/material";
import { useLocale } from "next-intl";
import { routing } from "@/src/i18n/routing";
import { useRouter, usePathname } from "@/src/i18n/navigation";
import { countryMapping } from "@/src/lib/country";
import Image from "next/image";
import { useLoaderDispatch } from "../../provider/LoaderProvider";

export default function LanguageSelector({
  hasBackground,
}: {
  hasBackground?: boolean;
}) {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const locales = routing.locales;
  const router = useRouter();
  const loader = useLoaderDispatch();
  const handleChangeLanguage = (e: SelectChangeEvent<string>) => {
    if (currentLocale !== e.target.value) {
      loader!({ type: "show" });
      router.replace(pathname, { locale: e.target.value });
    }
  };
  return (
    <Select
      id="language-selector"
      value={currentLocale}
      onChange={handleChangeLanguage}
      color="primary"
      autoWidth
      sx={{
        bgcolor: hasBackground ? "background.paper" : undefined,
        borderRadius: 3,
        transition: "all 0.3s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 4,
        },
      }}
    >
      {locales.map((l) => (
        <MenuItem value={l} key={l}>
          <Image
            alt="flag"
            src={`https://flagsapi.com/${countryMapping[l]}/flat/64.png`}
            width={20}
            height={25}
            style={{
              marginRight: "10px",
              display: "inline",
              width: "20px",
              height: "25px",
            }}
          />
          <Typography color="textPrimary" sx={{ display: "inline" }}>
            {new Intl.DisplayNames([l], { type: "language" }).of(l)}
          </Typography>
        </MenuItem>
      ))}
    </Select>
  );
}

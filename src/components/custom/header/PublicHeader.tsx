import { Box, Button, CircularProgress } from "@mui/material";
import SwitchTheme from "../../layout/SwitchTheme";
import LanguageSelector from "../../layout/LanguageSelector";
import { LoginRounded } from "@mui/icons-material";
import { Link, usePathname } from "@/src/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import AppLogo from "../../layout/AppLogo";

export default function PublicHeader() {
  const s = useSession();
  const t = useTranslations("/");
  const pathname = usePathname();
  return (
    <>
      <Box
        sx={{
          zIndex: 1,
          display: "flex",
          gap: "10px",
          position: "fixed",
          top: 0,
          left: 0,
          margin: 4,
        }}
      >
        <AppLogo isRedirectToIndex hasBackground />
        <SwitchTheme hasBackground />
        <LanguageSelector hasBackground />
      </Box>
      {!pathname.includes("signup") && !pathname.includes("signin") && (
        <Button
          variant="contained"
          size="large"
          endIcon={<LoginRounded />}
          sx={{
            px: 2,
            py: 1,
            top: 0,
            right: 0,
            margin: 4,
            position: "fixed",
            borderRadius: 3,
            fontWeight: 600,
            fontSize: ".9rem",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: 4,
            },
            transition: "all 0.3s",
            zIndex: 1,
          }}
        >
          {s.status === "loading" ? (
            <CircularProgress title={t("loading")} />
          ) : (
            <Link
              href={s.status === "authenticated" ? `/dashboard` : "/signin"}
              style={{ color: "inherit", textDecoration: "none" }}
            >
              {t(
                s.status === "authenticated"
                  ? "buttonBackToDashboard"
                  : "buttonSignIn",
              )}
            </Link>
          )}
        </Button>
      )}
    </>
  );
}

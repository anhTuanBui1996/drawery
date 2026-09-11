"use client";

import {
  Paper,
  TextField,
  Typography,
  Button,
  CircularProgress,
  Backdrop,
} from "@mui/material";
import {
  ChangeEvent,
  MouseEvent,
  KeyboardEvent,
  useEffect,
  useState,
} from "react";
import GitHubIcon from "@mui/icons-material/GitHub";
import GoogleIcon from "@/src/components/custom/icon/GoogleIcon";
import { SiNetlify as NetlifyIcon } from "react-icons/si";
import AppLogo from "@/src/components/layout/AppLogo";
import Swal from "sweetalert2";
import {
  ClientSafeProvider,
  LiteralUnion,
  signIn,
  useSession,
} from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/src/i18n/navigation";
import { useSnackbar } from "notistack";
import { BuiltInProviderType } from "next-auth/providers/index";
import CustomBox from "@/src/components/custom/background/CustomBox";
import { useSearchParams } from "next/navigation";

type User = {
  username: string;
  password: string;
};

const defaultCallBack = "/dashboard";

export default function SignIn({
  providers,
}: {
  providers: Record<
    LiteralUnion<BuiltInProviderType, string>,
    ClientSafeProvider
  > | null;
}) {
  const searchParams = useSearchParams();
  const callback = searchParams.get("callback");
  const router = useRouter();
  const session = useSession();
  const t = useTranslations("SignIn");
  const { enqueueSnackbar } = useSnackbar();

  const [user, setUser] = useState<User>({ username: "", password: "" });
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  useEffect(() => {
    switch (session.status) {
      case "authenticated":
        enqueueSnackbar({
          variant: "success",
          message: t("alertLoginSuccess"),
        });
        router.push(callback || `/dashboard`);
        break;
      case "loading":
        setIsAuthenticating(true);
        break;
      default:
        setIsAuthenticating(false);
        break;
    }
  }, [session.status]);

  const handleChangUsernameInput = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setUser((user) => ({ ...user, username: e.target.value }));
  };

  const handleChangePasswordInput = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setUser((user) => ({ ...user, password: e.target.value }));
  };

  // Login provider click handlers
  const mainLoginFlow = () => {
    if (user.username.trim() === "" || user.password.trim() === "") {
      Swal.fire({
        icon: "error",
        title: t("alertErrorTitle"),
        text: t("alertPleaseFill"),
      });
      return;
    }
    setIsAuthenticating(true);
    signIn("credentials", {
      ...user,
      defaultCallBack,
      redirect: false,
    }).then((result) => {
      setIsAuthenticating(false);
      if (!result?.ok && result?.error) {
        Swal.fire({
          icon: "error",
          title: t("alertErrorTitle"),
          text: result?.error || t("alertError"),
        });
      }
    });
  };

  const handlePressEnterInPassword = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      mainLoginFlow();
    }
  };

  const handleMainLoginClick = (
    e: MouseEvent<HTMLButtonElement | MouseEvent>,
  ) => {
    e.preventDefault();
    mainLoginFlow();
  };

  const handleOAuthSignIn = (provider: string) => {
    signIn(provider, { defaultCallBack }).then((result) => {
      setIsAuthenticating(false);
      if (!result?.ok && result?.error) {
        Swal.fire({
          icon: "error",
          title: t("alertErrorTitle"),
          text: result?.error || t("alertError"),
        });
      }
    });
  };

  return (
    <CustomBox
      className="flex h-screen flex-col items-center justify-between"
      sx={{
        background:
          "linear-gradient(135deg, #aabdf3 0%, #2f4975 50%, #06b6d4 100%)",
      }}
    >
      <Paper
        sx={{
          width: "30%",
          minWidth: 350,
          maxWidth: 450,
          minHeight: 550,
          margin: "auto",
          borderRadius: "2%",
          textAlign: "center",
          paddingX: "40px",
        }}
      >
        <Typography
          component={"span"}
          fontSize={20}
          textAlign={"center"}
          paddingTop={4}
          paddingBottom={1}
          fontWeight={"400"}
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          gap={1}
        >
          {t("title")} {<AppLogo />}
        </Typography>
        <Typography
          color={"GrayText"}
          fontSize={12}
          textAlign={"center"}
          paddingTop={1}
          paddingBottom={4}
          fontStyle={"italic"}
          fontFamily={"cursive"}
          fontWeight={"400"}
        >
          {t("subtitle")}
        </Typography>
        <TextField
          id="username"
          name="username"
          label={`${t("username")}/${t("email")}`}
          variant="outlined"
          sx={{
            marginBottom: "10px",
            width: "100%",
          }}
          onChange={handleChangUsernameInput}
          value={user.username}
          required
        />
        <TextField
          id="password"
          name="password"
          label={t("password")}
          variant="outlined"
          type="password"
          sx={{
            marginBottom: "10px",
            width: "100%",
          }}
          onChange={handleChangePasswordInput}
          onKeyDown={handlePressEnterInPassword}
          value={user.password}
          required
        />
        <div className="login-control flex-col justify-between align-middle">
          <div className="non-login flex justify-between mb-5">
            <Link
              href="/forgot"
              className="forgot-password"
              style={{
                fontSize: "12px",
                fontFamily: "'Roboto','Helvetica','Arial',sans-serif",
                textDecoration: "underline",
              }}
            >
              {t("forgotPassword")}
            </Link>
            <Link
              href="/signup"
              className="register-account"
              style={{
                fontSize: "12px",
                fontFamily: "'Roboto','Helvetica','Arial',sans-serif",
                textDecoration: "underline",
              }}
            >
              {t("buttonSignUp")}
            </Link>
          </div>
          <div className="login flex-col justify-between align-middle">
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleMainLoginClick}
              sx={{ fontWeight: "550" }}
            >
              {t("buttonSignIn")}
            </Button>
          </div>
          <fieldset className="other-login border px-3 py-3 mt-5 relative rounded-md">
            <legend className="absolute -top-6 left-1/2 -translate-x-1/2">
              <Paper elevation={0}>
                <Typography
                  fontSize={12}
                  textAlign="center"
                  marginTop={2}
                  paddingX={1}
                  whiteSpace="nowrap"
                >
                  {t("usingOrtherMethods")}
                </Typography>
              </Paper>
            </legend>
            {providers &&
              Object.values(providers)
                .filter((p) => p.id !== "email" && p.id !== "credentials")
                .map(({ id, name }) => {
                  let icon;
                  switch (id) {
                    case "google":
                      icon = <GoogleIcon />;
                      break;
                    case "github":
                      icon = <GitHubIcon />;
                      break;
                    default:
                      icon = <NetlifyIcon />;
                  }
                  return (
                    <Button
                      key={id}
                      variant="contained"
                      color="inherit"
                      fullWidth
                      onClick={() => handleOAuthSignIn(id)}
                      startIcon={icon}
                      sx={{ marginTop: "10px" }}
                    >
                      {name}
                    </Button>
                  );
                })}
          </fieldset>
        </div>
      </Paper>
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
        open={isAuthenticating}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </CustomBox>
  );
}

"use client";

import {
  Paper,
  TextField,
  Typography,
  Button,
  CircularProgress,
  Backdrop,
  Box,
} from "@mui/material";
import {
  ChangeEvent,
  MouseEvent,
  KeyboardEvent,
  useEffect,
  useState,
  use,
} from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { grey } from "@mui/material/colors";
import GitHubIcon from "@mui/icons-material/GitHub";
import GoogleIcon from "@/src/components/client/custom/icon/GoogleIcon";
import FacebookIcon from "@mui/icons-material/Facebook";
import { signIn, useSession } from "next-auth/react";
import Swal from "sweetalert2";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/src/i18n/navigation";
import AppLogo from "@/src/components/client/layout/AppLogo";
import SwitchTheme from "@/src/components/client/layout/SwitchTheme";

type User = {
  username: string;
  password: string;
};

const theme = createTheme({
  palette: {
    secondary: {
      main: grey[700],
    },
  },
});

const callbackUrl = "/dashboard";

export default function SignIn({
  callback,
  params,
}: Readonly<{
  callback: string | undefined;
  params: Promise<{ locale: string; username: string }>;
}>) {
  const router = useRouter();
  const session = useSession();
  const t = useTranslations("SignIn");
  useEffect(() => {
    switch (session.status) {
      case "authenticated":
        router.push(callback || `/${session.data.user.username}/dashboard`);
        break;
      case "loading":
        setIsAuthenticating(true);
        break;
      default:
        setIsAuthenticating(false);
        break;
    }
  }, [session.status]);

  const [user, setUser] = useState<User>({ username: "", password: "" });
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

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
      callbackUrl,
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

  const handleGithubLoginClick = () => {
    signIn("github", { callbackUrl }).then((result) => {
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

  const handleGoogleLoginClick = () => {
    setIsAuthenticating(true);
    signIn("google", { callbackUrl }).then((result) => {
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

  const handleFacebookLoginClick = () => {
    signIn("facebook", { callbackUrl }).then((result) => {
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
    <div
      className="flex h-screen flex-col items-center justify-between"
      style={{
        background:
          "linear-gradient(135deg, #aabdf3 0%, #2f4975 50%, #06b6d4 100%)",
      }}
    >
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
        }}
      >
        <SwitchTheme />
      </Box>
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
            <ThemeProvider theme={theme}>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={handleGithubLoginClick}
                startIcon={<GitHubIcon />}
              >
                Github
              </Button>
              <Button
                variant="contained"
                color="inherit"
                fullWidth
                onClick={handleGoogleLoginClick}
                startIcon={<GoogleIcon />}
                sx={{ marginY: "10px" }}
              >
                Google
              </Button>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                type="submit"
                onClick={handleFacebookLoginClick}
                startIcon={<FacebookIcon />}
              >
                Facebook
              </Button>
            </ThemeProvider>
          </fieldset>
        </div>
      </Paper>
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
        open={isAuthenticating}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );
}

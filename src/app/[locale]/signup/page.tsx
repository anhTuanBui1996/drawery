"use client";

import * as React from "react";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  TextField,
  Typography,
  Stack,
  Card as MuiCard,
} from "@mui/material";
import { createTheme, styled, ThemeProvider } from "@mui/material/styles";
import GitHubIcon from "@mui/icons-material/GitHub";
import { FaFacebook } from "react-icons/fa6";
import GoogleIcon from "@/src/components/client/custom/icon/GoogleIcon";
import { grey } from "@mui/material/colors";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/src/i18n/navigation";
import Swal from "sweetalert2";
import { signIn } from "next-auth/react";
import AppLogo from "@/src/components/client/layout/AppLogo";

const theme = createTheme({
  palette: {
    secondary: {
      main: grey[700],
    },
  },
});

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
  [theme.breakpoints.up("sm")]: {
    width: "450px",
  },
  ...theme.applyStyles("dark", {
    boxShadow:
      "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  height: "calc((1 - var(--template-frame-height, 0)) * 100dvh)",
  minHeight: "100%",
  padding: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(4),
  },
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    zIndex: -1,
    inset: 0,
    backgroundImage:
      "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
    backgroundRepeat: "no-repeat",
    ...theme.applyStyles("dark", {
      backgroundImage:
        "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))",
    }),
  },
}));

export default function SignUp(): React.JSX.Element {
  const router = useRouter();
  const t = useTranslations("SignUp");

  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState("");
  const [usernameError, setUsernameError] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState("");
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState("");
  const [nameError, setNameError] = React.useState(false);
  const [nameErrorMessage, setNameErrorMessage] = React.useState("");

  const validateInputs = () => {
    const email = document.getElementById("email") as HTMLInputElement;
    const username = document.getElementById("username") as HTMLInputElement;
    const password = document.getElementById("password") as HTMLInputElement;
    const firstname = document.getElementById("firstname") as HTMLInputElement;

    let isValid = true;

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage("Please enter a valid email address.");
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage("");
    }

    if (!username.value || username.value.length < 3) {
      setUsernameError(true);
      setUsernameErrorMessage("Username must be at least 3 characters long.");
      isValid = false;
    } else {
      setUsernameError(false);
      setUsernameErrorMessage("");
    }

    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage("Password must be at least 6 characters long.");
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage("");
    }

    if (!firstname.value || firstname.value.length < 1) {
      setNameError(true);
      setNameErrorMessage("First name is required.");
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage("");
    }

    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (nameError || emailError || passwordError) {
      return;
    }
    const data = new FormData(event.currentTarget);
    fetch("/api/auth/registerUserWithCredentials", {
      method: "POST",
      body: JSON.stringify({
        firstName: data.get("firstname"),
        lastName: data.get("lastname"),
        username: data.get("username"),
        email: data.get("email"),
        password: data.get("password"),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          Swal.fire({
            icon: "error",
            title: t("alertErrorTitle"),
            text: data.error,
          });
        } else {
          signIn("email", { email: data.user.email, redirect: false }).then(
            (result) => {
              if (result?.ok) {
                Swal.fire({
                  icon: "success",
                  title: t("alertSuccessTitle"),
                  text: t("alertCheckEmail"),
                }).then(() => {
                  router.push(`/${data.user.username}/dashboard`);
                });
              } else {
                Swal.fire({
                  icon: "error",
                  title: t("alertErrorTitle"),
                  text: result?.error || t("alertError"),
                });
              }
            },
          );
        }
      })
      .catch((err) => {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: t("alertErrorTitle"),
          text: err.message || t("alertError"),
        });
      });
  };

  return (
    <SignUpContainer
      direction="column"
      justifyContent="space-between"
      sx={{
        background:
          "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%)",
      }}
    >
      <Card variant="outlined">
        <AppLogo />
        <Typography
          component="h1"
          variant="h4"
          sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
        >
          Sign up
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            autoComplete="name"
            name="firstname"
            required
            fullWidth
            label={`${t("firstName")}`}
            id="firstname"
            placeholder="An"
            error={nameError}
            helperText={nameErrorMessage}
            color={nameError ? "error" : "primary"}
          />
          <TextField
            autoComplete="name"
            name="lastname"
            required
            fullWidth
            label={`${t("lastName")}`}
            id="lastname"
            placeholder="Tun (optional)"
          />
          <TextField
            required
            fullWidth
            id="email"
            placeholder="your@email.com"
            name="email"
            autoComplete="email"
            label={`${t("email")}`}
            error={emailError}
            helperText={emailErrorMessage}
            color={passwordError ? "error" : "primary"}
          />
          <TextField
            required
            fullWidth
            id="username"
            placeholder="yourusername"
            name="username"
            autoComplete="username"
            label={`${t("username")}`}
            error={usernameError}
            helperText={usernameErrorMessage}
            color={passwordError ? "error" : "primary"}
          />
          <TextField
            required
            fullWidth
            name="password"
            placeholder="••••••"
            type="password"
            id="password"
            autoComplete="new-password"
            label={`${t("password")}`}
            variant="outlined"
            error={passwordError}
            helperText={passwordErrorMessage}
            color={passwordError ? "error" : "primary"}
          />
          <FormControlLabel
            control={<Checkbox value="allowExtraEmails" color="primary" />}
            label="I want to receive updates via email."
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            onClick={validateInputs}
          >
            Sign up
          </Button>
        </Box>
        <Divider>
          <Typography sx={{ color: "text.secondary" }}>or</Typography>
        </Divider>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <ThemeProvider theme={theme}>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              onClick={() => alert("Sign up with Github")}
              startIcon={<GitHubIcon htmlColor="#000000" />}
            >
              Sign in with Github
            </Button>
            <Button
              variant="contained"
              color="inherit"
              fullWidth
              onClick={() => alert("Sign up with Google")}
              startIcon={<GoogleIcon />}
            >
              Sign in with Google
            </Button>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => alert("Sign up with Facebook")}
              startIcon={<FaFacebook />}
            >
              Sign in with Facebook
            </Button>
          </ThemeProvider>
          <Typography sx={{ textAlign: "center" }}>
            Already have an account?{" "}
            <Link
              href="/signin"
              style={{
                fontSize: "12px",
                fontFamily: "'Roboto','Helvetica','Arial',sans-serif",
                textDecoration: "underline",
              }}
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      </Card>
    </SignUpContainer>
  );
}

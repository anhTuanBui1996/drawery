"use client";

import { useRouter } from "@/src/i18n/navigation";
import { randomDigit } from "@/src/lib/utils";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { ChangeEvent, FormEvent, JSX, useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function ButtonDeleteUser({
  buttonContent,
  buttonIcon,
  buttonColor,
  title,
  content,
}: {
  buttonContent: string;
  buttonIcon?: JSX.Element;
  buttonColor:
    | "error"
    | "inherit"
    | "primary"
    | "secondary"
    | "success"
    | "info"
    | "warning";
  title: string;
  content: string;
}) {
  const t = useTranslations("Profile");
  const router = useRouter();
  const session = useSession();
  const [open, setOpen] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const [intervalSentTime, setIntervalSentTime] = useState<
    NodeJS.Timeout | undefined
  >(undefined);
  const [sendConfirmationButtonText, setSendConfirmationButtonText] = useState(
    t("send"),
  );
  const [confirmationCode, setConfirmationCode] = useState("");
  const [targetConfirmationCode, setTargetConfirmationCode] = useState<
    string | null
  >(null);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };

  const handleMouseUpPassword = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };

  const handleChangePassword = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setPassword(e.target.value);
  };

  useEffect(() => {
    if (sendConfirmationButtonText === t("send")) {
      if (intervalSentTime) {
        clearInterval(intervalSentTime);
        setIntervalSentTime(undefined);
      }
    }
  }, [sendConfirmationButtonText, intervalSentTime]);

  const handleClickSendCodeToEmail = () => {
    if (sendConfirmationButtonText !== t("send")) return;
    setSendConfirmationButtonText("...");
    handleSendConfirmationCodeMail()
      .then((res) => {
        res.json().then(({ success, targetCode }) => {
          if (success) {
            setTargetConfirmationCode(targetCode);
            const ti = setInterval(() => {
              setSendConfirmationButtonText((prevStr: string) => {
                let prevCount =
                  prevStr === t("send") ? 60 : parseInt(prevStr.slice(0, 2));
                if (prevCount === 1) return t("send");
                return String(prevCount - 1).padStart(2, "0");
              });
            }, 1000);
            setIntervalSentTime(ti);
          } else {
            setSendConfirmationButtonText(t("send"));
            Swal.fire({ title: t("confirmationCodeSendError"), icon: "error" });
          }
        });
      })
      .catch(() => setSendConfirmationButtonText(t("send")));
  };

  const handleChangeConfirmationCode = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setConfirmationCode(e.target.value);
  };

  const handleSendConfirmationCodeMail = async () => {
    return await fetch("/api/utils/sendConfirmationCodeMailForDeleteUser", {
      method: "POST",
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (
      !confirmationCode ||
      typeof confirmationCode !== "string" ||
      !/^\d{6}$/.test(confirmationCode)
    ) {
      Swal.fire({ title: t("confirmationCodeMustBe6"), icon: "error" });
      return;
    }

    if (confirmationCode !== targetConfirmationCode) {
      Swal.fire({
        title: t("confirmationCodeAndTargetNotIdentical"),
        icon: "error",
      });
      return;
    }

    fetch("/api/auth/deleteUser", {
      method: "DELETE",
      body: JSON.stringify({
        email: session.data?.user.email,
        password,
        emailConfirmedDeletionCode: confirmationCode,
      }),
    })
      .then(async (res) => await res.json())
      .then(({ success }) => {
        if (success) {
          router.replace("/signin");
        }
      });
  };
  return (
    <>
      <Button
        color={buttonColor}
        onClick={handleClickOpen}
        startIcon={buttonIcon}
        variant="contained"
      >
        {buttonContent}
      </Button>
      <Dialog onClose={handleClose} open={open}>
        <form onSubmit={handleSubmit} id="user-deletion-form">
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {content}
            </DialogContentText>
            <TextField
              autoFocus
              required
              margin="dense"
              id="password-for-user-deletion"
              name="password"
              label={t("passwordForUserDeletion")}
              value={password}
              onChange={handleChangePassword}
              type={showPassword ? "text" : "password"}
              fullWidth
              variant="filled"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showPassword
                            ? "hide the password"
                            : "display the password"
                        }
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        onMouseUp={handleMouseUpPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              required
              margin="dense"
              id="code-for-user-deletion"
              name="emailConfirmedDeletionCode"
              label={t("confirmationCodeForUserDeletion")}
              value={confirmationCode}
              onChange={handleChangeConfirmationCode}
              type="text"
              placeholder="XXXXXX"
              fullWidth
              variant="filled"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        variant="text"
                        onClick={handleClickSendCodeToEmail}
                        disabled={sendConfirmationButtonText !== t("send")}
                      >
                        {sendConfirmationButtonText}
                      </Button>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>{t("cancel")}</Button>
            <Button type="submit" form="user-deletion-form">
              {t("submit")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

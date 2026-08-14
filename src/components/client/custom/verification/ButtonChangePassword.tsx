"use client";

import { useRouter } from "@/src/i18n/navigation";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { ChangeEvent, JSX, MouseEvent, useState } from "react";
import Swal from "sweetalert2";
import { useLoaderDispatch } from "../../provider/LoaderProvider";
import ChangePasswordDTO from "@/src/types/account/ChangePasswordDTO";

export default function ButtonChangePassword({
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
  content?: string;
}) {
  const t = useTranslations("Profile");
  const router = useRouter();
  const session = useSession();
  const dispatch = useLoaderDispatch();
  const [open, setOpen] = useState(false);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [signOutAllDevices, setSignOutAllDevices] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleClickShowOldPassword = () => setShowOldPassword((show) => !show);
  const handleClickShowNewPassword = () => setShowNewPassword((show) => !show);
  const handleChangeOldPassword = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setOldPassword(e.target.value);
  };
  const handleChangeNewPassword = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setNewPassword(e.target.value);
  };
  const handleChangeSignOutAllDevices = (e: ChangeEvent<HTMLInputElement>) =>
    setSignOutAllDevices(e.target.checked);

  const handleSubmit = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    dispatch!({ type: "show" });
    if (!session.data?.user) {
      Swal.fire({
        title: t("alertErrorTitle"),
        icon: "error",
      });
      return;
    }
    const dto: ChangePasswordDTO = {
      oldPassword: oldPassword,
      newPassword: newPassword,
    };

    fetch("/api/account/changeUserPassword", {
      method: "POST",
      body: JSON.stringify(dto),
    })
      .then(async (res) => await res.json())
      .then(({ success }) => {
        if (success) {
          Swal.fire({
            title: t("alertSuccessTitle"),
            text: t("changePasswordSuccessfully"),
            icon: "success",
          }).then(() => {
            handleClose();
            router.replace("/signin");
          });
        } else {
          Swal.fire({
            title: t("alertErrorTitle"),
            text: t("alertError"),
            icon: "error",
          });
        }
      })
      .catch((err) => {
        Swal.fire({
          title: t("alertErrorTitle"),
          text: err,
          icon: "error",
        });
      })
      .finally(() => {
        handleClose();
        dispatch!({ type: "hide" });
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
            value={oldPassword}
            onChange={handleChangeOldPassword}
            type={showOldPassword ? "text" : "password"}
            fullWidth
            variant="filled"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={
                        showOldPassword
                          ? "hide the password"
                          : "display the password"
                      }
                      onClick={handleClickShowOldPassword}
                      edge="end"
                    >
                      {showOldPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            autoFocus
            required
            margin="dense"
            id="password-for-user-deletion"
            name="password"
            label={t("newPasswordForChangePassword")}
            value={newPassword}
            onChange={handleChangeNewPassword}
            type={showNewPassword ? "text" : "password"}
            fullWidth
            variant="filled"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={
                        showNewPassword
                          ? "hide the password"
                          : "display the password"
                      }
                      onClick={handleClickShowNewPassword}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={signOutAllDevices}
                  onChange={handleChangeSignOutAllDevices}
                />
              }
              label={t("signOutAllDevices")}
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t("cancel")}</Button>
          <Button onClick={handleSubmit}>{t("submit")}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

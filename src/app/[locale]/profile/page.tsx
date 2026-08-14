"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Swal from "sweetalert2";
import { Camera, KeyRound, Link2, Save, Trash2 } from "lucide-react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Avatar,
  Button,
  Chip,
  Divider,
  Stack,
  TextField,
  IconButton,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import { Link } from "@/src/i18n/navigation";
import ButtonDeleteUser from "@/src/components/client/custom/verification/ButtonDeleteUser";
import ButtonChangePassword from "@/src/components/client/custom/verification/ButtonChangePassword";

interface ProfileForm {
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  bio: string;
}

export default function Profile(): React.JSX.Element {
  const { data: session, status, update } = useSession();
  const t = useTranslations("Profile");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    name: "",
    phone: "",
    bio: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/account/profileOfUser");
      const data = await res.json();
      setForm({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        name: data.name || "",
        phone: data.phone || "",
        bio: data.bio || "",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange =
    (field: keyof ProfileForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));
    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/account/setAvatarOfUser", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        await update({ image: data.imageUrl });
        Swal.fire({
          icon: "success",
          title: t("alertSuccessTitle"),
          text: t("alertAvatarSuccess"),
        });
      } else {
        Swal.fire({
          icon: "error",
          title: t("alertErrorTitle"),
          text: data.error || t("alertError"),
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: t("alertErrorTitle"),
        text: t("alertError"),
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (form.name.trim() === "") {
      Swal.fire({
        icon: "error",
        title: t("alertErrorTitle"),
        text: t("alertNameRequired"),
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/account/profileOfUser", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        await update({ name: form.name });
        Swal.fire({
          icon: "success",
          title: t("alertSuccessTitle"),
          text: t("alertSaveSuccess"),
        });
      } else {
        Swal.fire({
          icon: "error",
          title: t("alertErrorTitle"),
          text: data.error || t("alertError"),
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: t("alertErrorTitle"),
        text: t("alertError"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const emailVerified = session?.user?.emailVerified;

  return (
    <>
      {/* Header */}
      <Box
        sx={{
          position: "relative",
          color: "white",
          py: { xs: 3, sm: 4 },
          pt: { xs: 10, sm: 12 },
        }}
      >
        <Container maxWidth="sm">
          <Box textAlign="center">
            <Typography
              variant="h5"
              fontWeight={700}
              mb={0.5}
              color="textSecondary"
            >
              {t("title")}
            </Typography>
            <Typography variant="body1" fontSize={14} color="textSecondary">
              {t("subtitle")}
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ pb: 4 }}>
        {/* Avatar + basic info */}
        <Paper
          sx={{
            borderRadius: 4,
            p: 3,
            mb: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: 3,
          }}
        >
          <Box sx={{ position: "relative", mb: 2 }}>
            <Avatar
              src={avatarPreview || session?.user?.image || undefined}
              sx={{ width: 88, height: 88 }}
            >
              {session?.user?.name?.[0] || session?.user?.email?.[0]}
            </Avatar>
            <IconButton
              size="small"
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              sx={{
                position: "absolute",
                bottom: -4,
                right: -4,
                bgcolor: "primary.main",
                color: "white",
                "&:hover": { bgcolor: "primary.dark" },
                width: 32,
                height: 32,
              }}
            >
              {isUploadingAvatar ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Camera size={16} />
              )}
            </IconButton>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarChange}
            />
          </Box>

          <Typography fontWeight={600} fontSize={17}>
            {session?.user?.name || t("noName")}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
            <Typography variant="body2" color="text.secondary">
              {session?.user?.email}
            </Typography>
            <Chip
              variant={emailVerified ? "filled" : "outlined"}
              color={emailVerified ? "success" : "error"}
              size="small"
              label={emailVerified ? t("emailVerified") : t("emailNotVerified")}
              sx={{ fontWeight: 600 }}
            />
          </Stack>
        </Paper>

        {/* Edit form */}
        <Paper sx={{ borderRadius: 4, boxShadow: 3, p: 3 }}>
          <Typography fontWeight={600} fontSize={15} mb={2}>
            {t("personalInfo")}
          </Typography>

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Stack spacing={2.5}>
              <TextField
                label={t("firstName")}
                fullWidth
                value={form.firstName}
                onChange={handleChange("firstName")}
              />

              <TextField
                label={t("lastName")}
                fullWidth
                value={form.lastName}
                onChange={handleChange("lastName")}
              />

              <TextField
                label={t("displayName")}
                fullWidth
                value={form.name}
                onChange={handleChange("name")}
              />

              <TextField
                label={t("email")}
                fullWidth
                value={session?.user?.email || ""}
                disabled
                helperText={t("emailImmutable")}
              />

              <TextField
                label={t("phone")}
                fullWidth
                value={form.phone}
                onChange={handleChange("phone")}
                placeholder="+84 xxx xxx xxx"
              />

              <TextField
                label={t("bio")}
                fullWidth
                multiline
                rows={3}
                value={form.bio}
                onChange={handleChange("bio")}
                placeholder={t("bioPlaceholder")}
              />

              <Button
                color="success"
                variant="contained"
                fullWidth
                disabled={isSaving}
                onClick={handleSave}
                startIcon={
                  isSaving ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Save size={16} />
                  )
                }
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  py: 1.2,
                }}
              >
                {t("saveButton")}
              </Button>
            </Stack>
          )}
        </Paper>

        <Divider sx={{ my: 3 }} />

        {/* Shortcuts */}
        <Stack spacing={1.5}>
          <Button
            component={Link}
            fullWidth
            href={`/account`}
            variant="contained"
            startIcon={<Link2 size={16} />}
            color="secondary"
          >
            {t("manageLinkedAccounts")}
          </Button>
          <ButtonChangePassword
            buttonColor="primary"
            title={t("changePassword")}
            buttonIcon={<KeyRound size={16} />}
            buttonContent={t("changePassword")}
          />
          <ButtonDeleteUser
            buttonColor="error"
            title={t("deleteUserTitle")}
            buttonIcon={<Trash2 size={16} />}
            buttonContent={t("deleteUser")}
            content={t("deleteUserDesc")}
          />
        </Stack>
      </Container>

      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
        open={status === "loading"}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}

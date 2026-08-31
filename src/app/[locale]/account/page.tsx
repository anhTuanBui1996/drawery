"use client";

import React, { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useFormatter, useTranslations } from "next-intl";
import Swal from "sweetalert2";
import { Link2, Unlink, ShieldCheck, KeyRound } from "lucide-react";
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
  Backdrop,
  CircularProgress,
} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import FacebookIcon from "@mui/icons-material/Facebook";
import GoogleIcon from "@/src/components/custom/icon/GoogleIcon";
import EmailIcon from "@mui/icons-material/Email";
import { usePathname } from "@/src/i18n/navigation";
import { useColorScheme } from "@mui/material/styles";
import ButtonChangePassword from "@/src/components/custom/verification/ButtonChangePassword";

interface ProviderConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  isLinked: boolean;
  emailVerified?: Date | null;
}

export default function LinkAccount(): React.JSX.Element {
  const { data: session, status } = useSession();
  const t = useTranslations("LinkAccount");
  const formatter = useFormatter();
  const s = useColorScheme();
  const pathname = usePathname();

  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchLinkedAccounts();
    }
  }, [status]);

  const fetchLinkedAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/account/getProvidersWithStatus");
      const data = await res.json();
      setProviders(data.providers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLink = (providerId: string, providerName: string) => {
    setActionLoading(providerId);
    signIn(providerId, { callbackUrl: pathname })
      .catch((err) => {
        Swal.fire({
          icon: "error",
          title: t("alertErrorTitle"),
          text: err,
        });
      })
      .finally(() => setActionLoading(null));
  };

  const handleUnlink = (providerId: string, providerName: string) => {
    Swal.fire({
      icon: "warning",
      title: t("confirmUnlinkTitle"),
      text: t("confirmUnlinkText", { providerName }),
      showCancelButton: true,
      confirmButtonText: t("confirmUnlinkButton"),
      cancelButtonText: t("cancelButton"),
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
    }).then(({ isConfirmed }) => {
      if (!isConfirmed) return;

      setActionLoading(providerId);
      try {
        fetch("/api/account/unlinkProvider", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: providerId }),
        }).then((res) => {
          if (res.ok) {
            res.json().then(({ success }) => {
              if (success) {
                setProviders((prev) =>
                  prev.map((p) =>
                    p.id === providerId ? { ...p, isLinked: false } : p,
                  ),
                );
                Swal.fire({
                  icon: "success",
                  title: t("alertSuccessTitle"),
                  text: t("alertUnlinkSuccess"),
                });
              } else {
                Swal.fire({
                  icon: "error",
                  title: t("alertErrorTitle"),
                  text: t("alertError"),
                });
              }
            });
          } else {
            Swal.fire({
              icon: "error",
              title: t("alertErrorTitle"),
              text: t("alertError"),
            });
          }
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: t("alertErrorTitle"),
          text: t("alertError"),
        });
      } finally {
        setActionLoading(null);
      }
    });
  };

  return (
    <>
      {/* Header */}
      <Box
        color="paleturquoise"
        sx={{
          position: "relative",
          color: "white",
          py: { xs: 3, sm: 4 },
          pt: { xs: 10, sm: 12 },
        }}
      >
        <Container maxWidth="sm">
          <Box textAlign="center">
            <Avatar
              sx={{
                width: 64,
                height: 64,
                mx: "auto",
                mb: 2,
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              <ShieldCheck size={30} />
            </Avatar>
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

      <Container maxWidth="sm" sx={{ pb: 2 }}>
        {/* Profile summary */}
        <Paper
          sx={{
            borderRadius: 4,
            p: 3,
            mb: 3,
            display: "flex",
            alignItems: "center",
            gap: 2,
            boxShadow: 3,
          }}
        >
          <Avatar
            src={session?.user?.image || undefined}
            sx={{
              width: 56,
              height: 56,
            }}
          >
            {session?.user?.name?.[0] || session?.user?.email?.[0]}
          </Avatar>
          <Box sx={{ overflow: "hidden" }}>
            <Typography fontWeight={600} noWrap>
              {session?.user?.name || t("noName")}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {session?.user?.email}
            </Typography>
          </Box>
        </Paper>

        {/* Linked accounts list */}
        <Paper sx={{ borderRadius: 4, boxShadow: 3, overflow: "hidden" }}>
          <Box sx={{ px: 3, pt: 3, pb: 1 }}>
            <Typography fontWeight={600} fontSize={15}>
              {t("connectedAccounts")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("connectedAccountsDesc")}
            </Typography>
          </Box>

          <Divider />

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            providers.map((provider, index) => {
              const isLinked = provider.isLinked;
              const isBusy = actionLoading === provider.id;
              const emailVerified = provider.emailVerified;

              switch (provider.id) {
                case "google":
                  provider.icon = <GoogleIcon />;
                  break;
                case "github":
                  provider.icon = <GitHubIcon color="action" />;
                  break;
                case "facebook":
                  provider.icon = <FacebookIcon color="action" />;
                  break;
                default:
                  provider.icon = <EmailIcon color="action" />;
              }

              return (
                <React.Fragment key={provider.id}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 3,
                      py: 2,
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor:
                            s.mode === "light" ? "ButtonHighlight" : "GrayText",
                        }}
                      >
                        {provider.icon}
                      </Box>
                      <Box>
                        <Typography fontWeight={500}>
                          {provider.name}
                        </Typography>
                        {provider.id !== "email" &&
                          (isLinked ? (
                            <Chip
                              color="success"
                              size="small"
                              label={t("linked")}
                              sx={{
                                fontWeight: 600,
                              }}
                            />
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {t("notLinked")}
                            </Typography>
                          ))}
                      </Box>
                    </Stack>

                    {provider.id !== "email" ? (
                      isLinked ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          disabled={isBusy}
                          onClick={() =>
                            handleUnlink(provider.id, provider.name)
                          }
                          startIcon={
                            isBusy ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : (
                              <Unlink size={14} />
                            )
                          }
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                          }}
                        >
                          {t("unlinkButton")}
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          disabled={isBusy}
                          onClick={() => handleLink(provider.id, provider.name)}
                          startIcon={
                            isBusy ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : (
                              <Link2 size={14} />
                            )
                          }
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                          }}
                        >
                          {t("linkButton")}
                        </Button>
                      )
                    ) : (
                      <Chip
                        variant={emailVerified ? "filled" : "outlined"}
                        color={emailVerified ? "success" : "error"}
                        size="small"
                        label={
                          emailVerified
                            ? t("emailVerified") +
                              " " +
                              formatter.dateTime(new Date(emailVerified), {
                                dateStyle: "short",
                                timeStyle: "medium",
                              })
                            : t("emailNotVerified")
                        }
                        sx={{
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>
                  {index < providers.length - 1 && <Divider />}
                </React.Fragment>
              );
            })
          )}
        </Paper>

        {/* Change password shortcut */}
        <Box
          sx={{
            mt: "20px",
            width: "100%",
          }}
        >
          <ButtonChangePassword
            buttonColor="primary"
            title={t("changePassword")}
            buttonIcon={<KeyRound size={16} />}
            buttonContent={t("changePassword")}
            buttonSx={{
              width: "100%",
            }}
          />
        </Box>
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

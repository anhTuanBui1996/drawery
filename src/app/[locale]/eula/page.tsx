import React from "react";
import { getTranslations } from "next-intl/server";
import {
  Box,
  Container,
  Typography,
  Paper,
  Avatar,
  Divider,
  Stack,
} from "@mui/material";
import {
  FileText,
  Key,
  UserCog,
  Ban,
  Copyright,
  XCircle,
  ShieldAlert,
  Scale,
  Gavel,
  RefreshCw,
  Mail,
} from "lucide-react";

interface EulaSection {
  title: string;
  paragraphs: string[];
}

const SECTION_ICONS = [
  Key,
  UserCog,
  Ban,
  FileText,
  Copyright,
  XCircle,
  ShieldAlert,
  Scale,
  Gavel,
  RefreshCw,
];

export async function generateMetadata() {
  const t = await getTranslations("Eula");
  return {
    title: `${t("title")} | Drawery`,
    description: t("subtitle"),
  };
}

export default async function Eula(): Promise<React.JSX.Element> {
  const t = await getTranslations("Eula");
  const sections = t.raw("sections") as EulaSection[];
  const lastUpdated = t("lastUpdated");

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
        <Container maxWidth="md">
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
              <FileText size={30} />
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
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              mt={1}
            >
              {lastUpdated}
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ pb: 8 }}>
        {/* Intro */}
        <Paper sx={{ borderRadius: 4, p: 3, mb: 3, boxShadow: 3 }}>
          <Typography variant="body1" color="text.secondary" lineHeight={1.7}>
            {t("intro")}
          </Typography>
        </Paper>

        {/* Sections */}
        <Stack spacing={3}>
          {sections.map((section, index) => {
            const Icon = SECTION_ICONS[index % SECTION_ICONS.length];
            return (
              <Paper
                key={index}
                sx={{ borderRadius: 4, boxShadow: 3, overflow: "hidden" }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 3, pt: 3, pb: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "primary.main",
                      color: "white",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} />
                  </Box>
                  <Typography fontWeight={600} fontSize={16}>
                    {`${index + 1}. ${section.title}`}
                  </Typography>
                </Box>

                <Divider />

                <Box sx={{ px: 3, py: 2.5 }}>
                  <Stack spacing={1.5}>
                    {section.paragraphs.map((p, i) => (
                      <Typography
                        key={i}
                        variant="body2"
                        color="text.secondary"
                        lineHeight={1.7}
                      >
                        {p}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              </Paper>
            );
          })}
        </Stack>

        {/* Contact */}
        <Paper
          sx={{
            borderRadius: 4,
            p: 3,
            mt: 3,
            boxShadow: 3,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "success.main",
              flexShrink: 0,
            }}
          >
            <Mail size={18} />
          </Box>
          <Box>
            <Typography fontWeight={600} fontSize={14}>
              {t("contactTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("contactDesc")}{" "}
              <a href={`mailto:${t("contactEmail")}`} style={{ color: "inherit" }}>
                {t("contactEmail")}
              </a>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </>
  );
}

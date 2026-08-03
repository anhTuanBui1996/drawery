"use client";

import {
  Database,
  Zap,
  Users,
  Palette,
  Download,
  Share2,
  Target,
  Award,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Paper,
} from "@mui/material";
import { LoginRounded } from "@mui/icons-material";
import { Link } from "@/src/i18n/navigation";
import { useTranslations } from "next-intl";
import SwitchTheme from "@/src/components/client/layout/SwitchTheme";
import { useSession } from "next-auth/react";
import CustomBox from "@/src/components/client/custom/background/CustomBox";
import LanguageSelector from "@/src/components/client/layout/LanguageSelector";

const Index = () => {
  const s = useSession();
  const t = useTranslations("/");
  const features = [
    {
      icon: <Database className="w-6 h-6" />,
      title: t("feature1Title"),
      description: t("feature1Desc"),
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: t("feature2Title"),
      description: t("feature2Desc"),
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: t("feature3Title"),
      description: t("feature3Desc"),
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: t("feature4Title"),
      description: t("feature4Desc"),
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: t("feature5Title"),
      description: t("feature5Desc"),
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: t("feature6Title"),
      description: t("feature6Desc"),
    },
  ];

  const benefits = [
    t("benefit1"),
    t("benefit2"),
    t("benefit3"),
    t("benefit4"),
    t("benefit5"),
  ];

  const testimonials = [
    {
      quote: t("testimonial1Text"),
      author: "Sarah Chen",
      role: t("testimonial1Role"),
      company: "TechFlow Inc.",
    },
    {
      quote: t("testimonial2Text"),
      author: "Marcus Rodriguez",
      role: t("testimonial2Role"),
      company: "DataStream Solutions",
    },
    {
      quote: t("testimonial3Text"),
      author: "Emily Watson",
      role: t("testimonial3Role"),
      company: "CloudFirst Corp.",
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Hero Section */}
      <CustomBox
        sx={{
          position: "relative",
          overflow: "hidden",
        }}
      >
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
          <SwitchTheme hasBackground={true} />
          <LanguageSelector />
        </Box>
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
          <Link
            href={
              s.status === "authenticated"
                ? `/${s.data.user.username}/dashboard`
                : "/signin"
            }
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {t(
              s.status === "authenticated"
                ? "buttonBackToDashboard"
                : "buttonSignIn",
            )}
          </Link>
        </Button>
        <Container
          maxWidth="lg"
          sx={{ position: "relative", py: { xs: 12, lg: 16 } }}
        >
          <Box textAlign="center">
            <Chip
              icon={<Sparkles size={16} />}
              label={t("productionTitle")}
              sx={{
                mb: 4,
                bgcolor: "rgba(255,255,255,0.1)",
                color: "white",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.2)",
                fontWeight: 500,
              }}
            />

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2.5rem", sm: "3.5rem", lg: "4rem" },
                fontWeight: 700,
                mb: 3,
              }}
              color="textPrimary"
            >
              {t("title")}
              <Typography
                component="span"
                sx={{
                  display: "block",
                  background: "linear-gradient(to right, #fbbf24, #fb923c)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {t("dbRelationship")}
              </Typography>
            </Typography>

            <Typography
              variant="h5"
              sx={{
                mb: 4,
                maxWidth: "800px",
                mx: "auto",
                lineHeight: 1.6,
              }}
              color="textPrimary"
            >
              {t("topBodyText")}
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                justifyContent: "center",
              }}
            >
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowRight size={20} />}
                sx={{
                  bgcolor: "white",
                  color: "#2563eb",
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 600,
                  fontSize: "1.125rem",
                  "&:hover": {
                    bgcolor: "#eff6ff",
                    transform: "translateY(-2px)",
                    boxShadow: 4,
                  },
                  transition: "all 0.3s",
                }}
              >
                {t("buttonStartCreating")}
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                  bgcolor: "rgba(255,255,255,0.1)",
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 600,
                  fontSize: "1.125rem",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.2)",
                    borderColor: "rgba(255,255,255,0.3)",
                    boxShadow: 4,
                  },
                  transition: "all 0.3s",
                }}
              >
                {t("buttonWatchDemo")}
              </Button>
            </Box>
          </Box>
        </Container>
      </CustomBox>

      {/* Features Section */}
      <Box sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8}>
            <Typography
              variant="h3"
              fontWeight={700}
              color="text.primary"
              mb={2}
            >
              {t("featureTitle")}
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              maxWidth="800px"
              mx="auto"
            >
              {t("featureSubtitle")}
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
                <Card
                  sx={{
                    height: "100%",
                    p: 2,
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "grey.200",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    "&:hover": {
                      borderColor: "#bfdbfe",
                      boxShadow: 8,
                      transform: "translateY(-8px)",
                    },
                  }}
                >
                  <CardContent>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        mb: 3,
                        background: "text.background",
                        transition: "transform 0.3s",
                        "&:hover": {
                          transform: "scale(1.1)",
                        },
                      }}
                    >
                      {feature.icon}
                    </Avatar>
                    <Typography variant="h6" fontWeight={600} mb={1.5}>
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      lineHeight={1.6}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Benefits Section */}
      <Box
        sx={{
          py: 10,
          background:
            "linear-gradient(135deg, #aabdf3 0%, #2f4975 50%, #06b6d4 100%)",
          color: "white",
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, lg: 6 }}>
              <Typography variant="h3" fontWeight={700} mb={3}>
                {t("benefitsTitle")}
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: "#bfdbfe", mb: 4, lineHeight: 1.6 }}
              >
                {t("benefitsSubtitle")}
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {benefits.map((benefit, index) => (
                  <Box
                    key={index}
                    sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                  >
                    <CheckCircle size={24} color="#4ade80" />
                    <Typography variant="h6">{benefit}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>

            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper
                sx={{
                  bgcolor: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 4,
                  p: 4,
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Award
                    size={32}
                    color="#fbbf24"
                    style={{ marginRight: 12 }}
                  />
                  <Typography
                    variant="h5"
                    fontWeight={600}
                    sx={{ color: "#bfdbfe" }}
                  >
                    Trusted by Professionals
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 6 }}>
                    <Box textAlign="center">
                      <Typography
                        variant="h3"
                        fontWeight={700}
                        sx={{ color: "#bfdbfe" }}
                      >
                        50K+
                      </Typography>
                      <Typography sx={{ color: "#bfdbfe" }}>
                        Active Users
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box textAlign="center">
                      <Typography
                        variant="h3"
                        fontWeight={700}
                        sx={{ color: "#bfdbfe" }}
                      >
                        1M+
                      </Typography>
                      <Typography sx={{ color: "#bfdbfe" }}>
                        ERDs Created
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box textAlign="center">
                      <Typography
                        variant="h3"
                        fontWeight={700}
                        sx={{ color: "#bfdbfe" }}
                      >
                        99.9%
                      </Typography>
                      <Typography sx={{ color: "#bfdbfe" }}>Uptime</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box textAlign="center">
                      <Typography
                        variant="h3"
                        fontWeight={700}
                        sx={{ color: "#bfdbfe" }}
                      >
                        24/7
                      </Typography>
                      <Typography sx={{ color: "#bfdbfe" }}>Support</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Target Audience */}
      <Box sx={{ py: 10 }} color={"Background"}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8}>
            <Typography
              variant="h3"
              fontWeight={700}
              color="text.primary"
              mb={2}
            >
              {t("targetAudienceTitle")}
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              maxWidth="800px"
              mx="auto"
            >
              {t("targetAudienceDesc")}
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box textAlign="center" p={4}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    background: "linear-gradient(to right, #4ade80, #16a34a)",
                    mx: "auto",
                    mb: 3,
                  }}
                >
                  <Database size={40} />
                </Avatar>
                <Typography variant="h6" fontWeight={600} mb={1.5}>
                  {t("targetAudience1Title")}
                </Typography>
                <Typography color="text.secondary">
                  {t("targetAudience1Desc")}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box textAlign="center" p={4}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    background: "linear-gradient(to right, #60a5fa, #2563eb)",
                    mx: "auto",
                    mb: 3,
                  }}
                >
                  <Users size={40} />
                </Avatar>
                <Typography variant="h6" fontWeight={600} mb={1.5}>
                  {t("targetAudience2Title")}
                </Typography>
                <Typography color="text.secondary">
                  {t("targetAudience2Desc")}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box textAlign="center" p={4}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    background: "linear-gradient(to right, #a78bfa, #7c3aed)",
                    mx: "auto",
                    mb: 3,
                  }}
                >
                  <Target size={40} />
                </Avatar>
                <Typography variant="h6" fontWeight={600} mb={1.5}>
                  {t("targetAudience3Title")}
                </Typography>
                <Typography color="text.secondary">
                  {t("targetAudience3Desc")}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Testimonials */}
      <Box
        sx={{
          py: 10,
          bgcolor:
            "linear-gradient(135deg, #aabdf3 0%, #2f4975 50%, #06b6d4 100%)",
        }}
      >
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8}>
            <Typography
              variant="h3"
              fontWeight={700}
              color="text.primary"
              mb={2}
            >
              {t("testimonialsTitle")}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {t("testimonialsSubtitle")}
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid size={{ xs: 12, lg: 4 }} key={index}>
                <Card
                  sx={{
                    height: "100%",
                    p: 4,
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "grey.200",
                    transition: "box-shadow 0.3s",
                    "&:hover": {
                      boxShadow: 8,
                    },
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ mb: 3, fontStyle: "italic", lineHeight: 1.6 }}
                    >
                      "{testimonial.quote}"
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          background:
                            "linear-gradient(to right, #60a5fa, #a78bfa)",
                          mr: 2,
                          fontWeight: 600,
                        }}
                      >
                        {testimonial.author[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {testimonial.author}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {testimonial.role}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="#2563eb"
                          fontWeight={500}
                        >
                          {testimonial.company}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: 10,
          background:
            "linear-gradient(135deg, #aabdf3 0%, #2f4975 50%, #06b6d4 100%)",
          color: "white",
        }}
      >
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography variant="h3" fontWeight={700} mb={3}>
              {t("ctaTitle")}
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: "#bfdbfe", mb: 4, lineHeight: 1.6 }}
            >
              {t("ctaSubtitle")}
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                justifyContent: "center",
                mb: 2,
              }}
            >
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowRight size={20} />}
                sx={{
                  bgcolor: "white",
                  color: "#2563eb",
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 600,
                  fontSize: "1.125rem",
                  "&:hover": {
                    bgcolor: "#eff6ff",
                    transform: "translateY(-2px)",
                    boxShadow: 8,
                  },
                  transition: "all 0.3s",
                }}
              >
                {t("ctaButton")}
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                  bgcolor: "rgba(255,255,255,0.1)",
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 600,
                  fontSize: "1.125rem",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.2)",
                    borderColor: "rgba(255,255,255,0.3)",
                    boxShadow: 4,
                  },
                  transition: "all 0.3s",
                }}
              >
                {t("ctaButtonDemo")}
              </Button>
            </Box>

            <Typography variant="body2" sx={{ color: "#bfdbfe" }}>
              {t("ctaCredit")}
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Index;

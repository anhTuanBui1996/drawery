import DashBoardCard from "@/src/components/custom/content/DashBoardCard";
import { Box, Container, Grid, Paper, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

export default function Dashboard() {
  const t = useTranslations("Dashboard");
  return (
    <Container maxWidth="xl">
      <Box
        sx={{
          minHeight: "calc(100vh - 64px)",
          py: 2,
        }}
      >
        <Typography variant="h4" color="textSecondary" my={2}>
          {t("myDiagrams")}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xl: 3, lg: 4, md: 6, sm: 12 }}>
            <DashBoardCard />
          </Grid>
          <Grid size={{ xl: 3, lg: 4, md: 6, sm: 12 }}>
            <DashBoardCard />
          </Grid>
          <Grid size={{ xl: 3, lg: 4, md: 6, sm: 12 }}>
            <DashBoardCard />
          </Grid>
          <Grid size={{ xl: 3, lg: 4, md: 6, sm: 12 }}>
            <DashBoardCard />
          </Grid>
          <Grid size={{ xl: 3, lg: 4, md: 6, sm: 12 }}>
            <DashBoardCard />
          </Grid>
          <Grid size={{ xl: 3, lg: 4, md: 6, sm: 12 }}>
            <DashBoardCard />
          </Grid>
          <Grid size={{ xl: 3, lg: 4, md: 6, sm: 12 }}>
            <DashBoardCard />
          </Grid>
          <Grid size={{ xl: 3, lg: 4, md: 6, sm: 12 }}>
            <DashBoardCard />
          </Grid>
          <Grid size={{ xl: 3, lg: 4, md: 6, sm: 12 }}>
            <DashBoardCard />
          </Grid>
          <Grid size={{ xl: 3, lg: 4, md: 6, sm: 12 }}>
            <DashBoardCard />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

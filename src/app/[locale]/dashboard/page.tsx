"use client";

import DashboardDiagramCard from "@/src/components/custom/content/DashboardCard";
import {
  Box,
  Button,
  Card,
  Container,
  Grid,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Skeleton,
  Typography,
} from "@mui/material";
import { MoreVerticalIcon } from "lucide-react";
import { FaCheckDouble, FaPlus } from "react-icons/fa";
import { useLocale, useTranslations } from "next-intl";
import { MouseEvent, useEffect, useId, useState } from "react";
import Swal from "sweetalert2";
import { NewDiagram } from "@/src/types/data/DiagramTransfer";
import { useSession } from "next-auth/react";
import { useRouter } from "@/src/i18n/navigation";
import { DiagramInfo } from "@/src/types/model/DiagramData";
import { useSnackbar } from "notistack";
import { AddBox } from "@mui/icons-material";

export default function Dashboard() {
  const locale = useLocale();
  const session = useSession();
  const router = useRouter();
  const id = useId();
  const buttonId = `${id}-diagram-card-button`;
  const menuId = `${id}-diagram-card-menu`;
  const t = useTranslations("Dashboard");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [myDiagrams, setMyDiagrams] = useState<null | DiagramInfo[]>(null);
  const [sharedWithMeDiagrams, setSharedWithMeDiagrams] = useState<
    null | DiagramInfo[]
  >(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetch("/api/data/diagram", { headers: { "accept-language": locale } })
      .then((res) => res.json())
      .then(
        ({
          success,
          diagrams,
        }: {
          success: boolean;
          diagrams: DiagramInfo[];
        }) => success && setMyDiagrams(diagrams),
      );
    fetch("/api/data/diagram/shareWithMe", {
      headers: { "accept-language": locale },
    })
      .then((res) => res.json())
      .then(
        ({
          success,
          diagrams,
        }: {
          success: boolean;
          diagrams: DiagramInfo[];
        }) => success && setSharedWithMeDiagrams(diagrams),
      )
      .catch((err) => {
        console.error(err);
        enqueueSnackbar({ variant: "error", message: t("alertError") });
      });
  }, []);

  const handleClickMyDiagramMenu = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMyDiagramMenu = () => {
    setAnchorEl(null);
  };

  const handleAddNewDiagram = () => {
    if (!session.data?.user.id) {
      Swal.fire({
        icon: "error",
        title: t("alertErrorTitle"),
        text: t("noSessionFound"),
      });
      return;
    }

    const newDiagram: NewDiagram = {
      createdAt: new Date(),
      isPrivate: true,
    };
    fetch("/api/data/addNewDiagram", {
      method: "POST",
      headers: { "accept-language": locale },
      body: JSON.stringify(newDiagram),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          router.push(`/drawing/erd/${data.newDiagramId}`);
        } else {
          Swal.fire({
            icon: "error",
            title: t("alertErrorTitle"),
            text: t("alertError"),
          });
        }
      })
      .catch((err) => {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: t("alertErrorTitle"),
          text: t("alertError"),
        });
      })
      .finally(() => handleCloseMyDiagramMenu());
  };

  return (
    <Container maxWidth="xl">
      <Box
        sx={{
          minHeight: "calc(100vh - 64px)",
          py: 2,
        }}
      >
        <Box
          display={"flex"}
          flexDirection={"row"}
          justifyContent={"left"}
          flexWrap={"nowrap"}
          alignItems={"center"}
          sx={{ marginTop: 2, marginBottom: 1 }}
        >
          <Typography
            variant="h4"
            component={"span"}
            color="textSecondary"
            my={2}
          >
            {t("myERD")}
          </Typography>
          <IconButton
            aria-label="settings"
            id={buttonId}
            onClick={handleClickMyDiagramMenu}
            sx={{
              marginLeft: "10px",
            }}
          >
            <MoreVerticalIcon />
          </IconButton>
          <Menu
            id={menuId}
            anchorEl={anchorEl}
            open={open}
            onClose={handleCloseMyDiagramMenu}
            slotProps={{
              list: {
                "aria-labelledby": buttonId,
              },
            }}
          >
            <MenuItem onClick={handleAddNewDiagram}>
              <ListItemIcon>
                <FaPlus />
              </ListItemIcon>
              <Typography sx={{ textAlign: "center" }}>
                {t("addNewERD")}
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleCloseMyDiagramMenu}>
              <ListItemIcon>
                <FaCheckDouble />
              </ListItemIcon>
              <Typography sx={{ textAlign: "center" }}>
                {t("selectMany")}
              </Typography>
            </MenuItem>
          </Menu>
        </Box>
        <Grid container spacing={2} direction={"row"}>
          {myDiagrams ? (
            myDiagrams.length ? (
              myDiagrams.map((d) => (
                <Grid size={{ xl: 3, lg: 4, md: 6, sm: 12 }} key={d.diagramId}>
                  <DashboardDiagramCard
                    isOwned
                    type="erd"
                    diagramId={d.diagramId}
                    createdAt={new Date(d.createdAt)}
                    lastUpdatedAt={d.lastUpdatedAt}
                    ownerAvatar={d.ownerAvatar}
                    ownerName={d.ownerName}
                    title={d.title}
                  />
                </Grid>
              ))
            ) : (
              <Grid size={12}>
                <Button
                  variant="text"
                  color="success"
                  fullWidth
                  onClick={handleAddNewDiagram}
                  startIcon={<AddBox />}
                  sx={{
                    height: "292.03px",
                  }}
                >
                  {t("noDiagramsAddNew")}...
                </Button>
              </Grid>
            )
          ) : (
            <>
              <Grid size={{ xl: 3, lg: 4, md: 6, sm: 12 }}>
                <Card>
                  <Skeleton
                    animation={"wave"}
                    height={292.03}
                    variant="rounded"
                  />
                </Card>
              </Grid>
              <Grid size={{ xl: 3, lg: 4, md: 6, sm: 12 }}>
                <Card>
                  <Skeleton
                    animation={"wave"}
                    height={292.03}
                    variant="rounded"
                  />
                </Card>
              </Grid>
              <Grid size={{ xl: 3, lg: 4, md: 6, sm: 12 }}>
                <Card>
                  <Skeleton
                    animation={"wave"}
                    height={292.03}
                    variant="rounded"
                  />
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </Box>
    </Container>
  );
}

import { useRouter } from "@/src/i18n/navigation";
import {
  Avatar,
  Card,
  CardActionArea,
  CardContent,
  CardHeader,
  CardMedia,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { red } from "@mui/material/colors";
import { MoreVerticalIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { MouseEvent, useId, useState } from "react";
import { FaShare, FaTrash } from "react-icons/fa";

export default function DashboardDiagramCard({
  isOwned,
  ownerAvatar,
  ownerName,
  createdAt,
  lastUpdatedAt,
  diagramId,
  type,
  title,
}: {
  isOwned: boolean;
  ownerAvatar?: string | null;
  ownerName?: string | null;
  createdAt: Date;
  lastUpdatedAt?: Date;
  diagramId: string;
  type: "erd" | "dfd";
  title?: string | null;
}) {
  const router = useRouter();
  const t = useTranslations("DashboardCard");
  const locale = useLocale();
  const id = useId();
  const buttonId = `${id}-my-diagram-button`;
  const menuId = `${id}-my-diagram-menu`;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpenMenu = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  const handleAccessDrawingPageWithDiagramId = () => {
    router.push(`/drawing/${type}/${diagramId}`);
  };

  return (
    <Card>
      <CardHeader
        avatar={
          !isOwned &&
          ownerAvatar &&
          ownerName && (
            <Avatar
              sx={{ bgcolor: red[500] }}
              aria-label="recipe"
              src={ownerAvatar}
            >
              {ownerName}
            </Avatar>
          )
        }
        action={
          <>
            <IconButton
              aria-label="settings"
              onClick={handleOpenMenu}
              id={buttonId}
            >
              <MoreVerticalIcon />
            </IconButton>
            <Menu
              id={menuId}
              anchorEl={anchorEl}
              open={open}
              onClose={handleCloseMenu}
              slotProps={{
                list: {
                  "aria-labelledby": buttonId,
                },
              }}
            >
              <MenuItem onClick={handleCloseMenu}>
                <ListItemIcon>
                  <FaShare />
                </ListItemIcon>
                <Typography sx={{ textAlign: "center" }}>
                  {t("shareDiagram")}
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleCloseMenu}>
                <ListItemIcon>
                  <FaTrash />
                </ListItemIcon>
                <Typography sx={{ textAlign: "center" }}>
                  {t("removeDiagram")}
                </Typography>
              </MenuItem>
            </Menu>
          </>
        }
        title={
          isOwned
            ? `${t("createdAt")} ${createdAt.toLocaleString(locale)}`
            : ownerName
        }
        subheader={
          isOwned
            ? lastUpdatedAt
              ? `${t("lastUpdatedAt")} ${new Date(lastUpdatedAt).toLocaleString(locale)}`
              : ""
            : `${t("createdAt")} ${createdAt.toLocaleString(locale)}`
        }
      />
      <CardActionArea onClick={handleAccessDrawingPageWithDiagramId}>
        <CardMedia
          sx={{ height: 140 }}
          image="/erd-example.png"
          title="erd example"
        />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div" mb={0}>
            {title || t("noTitle")}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

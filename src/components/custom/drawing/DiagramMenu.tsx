import {
  Autocomplete,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { MouseEvent, useId, useState } from "react";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import { FaShare, FaTrash } from "react-icons/fa";

export default function DiagramMenu({ diagramId }: { diagramId?: string }) {
  const id = useId();
  const buttonId = `${id}-diagram-setting-button`;
  const menuId = `${id}-diagram-setting-menu`;
  const t = useTranslations("Drawing");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleDeleteDiagram = () => {};

  return (
    <>
      <IconButton id={buttonId} onClick={handleClick}>
        <SettingsSuggestIcon />
      </IconButton>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            "aria-labelledby": diagramId,
          },
          paper: {
            sx: {
              px: 1,
            },
          },
        }}
      >
        <Autocomplete
          options={[]}
          sx={{ width: 300 }}
          renderInput={(params) => (
            <TextField {...params} label={t("search")} />
          )}
        />
        <MenuItem sx={{ marginTop: 1 }} onClick={handleDeleteDiagram}>
          <ListItemIcon>
            <FaShare />
          </ListItemIcon>
          <Typography sx={{ textAlign: "center" }}>
            {t("shareDiagram")}
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleDeleteDiagram}>
          <ListItemIcon>
            <FaTrash />
          </ListItemIcon>
          <Typography sx={{ textAlign: "center" }}>
            {t("removeDiagram")}
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
}

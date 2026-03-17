import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import { Iconify } from 'src/components/iconify';

import type { ContentMenuState } from '../types';

// ----------------------------------------------------------------------

type ContentMenuProps = {
  menuState: ContentMenuState;
  onClose: () => void;
  onDuplicate: () => void;
  onTurnIntoHover: (e: React.MouseEvent<HTMLElement>) => void;
  onTurnIntoClick: (e: React.MouseEvent<HTMLElement>) => void;
};

export function ContentMenu({
  menuState,
  onClose,
  onDuplicate,
  onTurnIntoHover,
  onTurnIntoClick,
}: ContentMenuProps) {
  return (
    <Menu anchorEl={menuState.anchor} open={Boolean(menuState.anchor)} onClose={onClose}>
      <MenuItem onClick={onDuplicate}>
        <ListItemIcon>
          <Iconify icon="solar:copy-bold" width={20} />
        </ListItemIcon>
        <ListItemText primary="Duplizieren" />
      </MenuItem>
      <MenuItem onMouseEnter={onTurnIntoHover} onClick={onTurnIntoClick}>
        <ListItemIcon>
          <Iconify icon="solar:restart-bold" width={20} />
        </ListItemIcon>
        <ListItemText primary="Umwandeln in" />
        <Iconify icon="eva:arrow-ios-forward-fill" width={16} sx={{ ml: 'auto' }} />
      </MenuItem>
    </Menu>
  );
}

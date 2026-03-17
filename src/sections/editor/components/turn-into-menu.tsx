import Menu from '@mui/material/Menu';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import { Iconify } from 'src/components/iconify';

import { commandOptions } from '../constants';

import type { ContentType, CommandOption } from '../types';

// ----------------------------------------------------------------------

type TurnIntoMenuProps = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onMouseLeave: () => void;
  onSelect: (contentType: ContentType) => void;
  onAITransform: (contentType: ContentType) => void;
};

export function TurnIntoMenu({ anchorEl, onClose, onMouseLeave, onSelect, onAITransform }: TurnIntoMenuProps) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      MenuListProps={{ onMouseLeave }}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
    >
      {commandOptions.map((option: CommandOption) => (
        <MenuItem
          key={option.id}
          onClick={() => onSelect(option.contentType)}
          sx={{
            display: 'flex',
            gap: 1,
            pr: 1,
            '& .ai-button': { opacity: 0, transition: 'opacity 0.2s' },
            '&:hover .ai-button': { opacity: 1 },
          }}
        >
          <ListItemIcon>
            <Iconify icon={option.icon} width={20} />
          </ListItemIcon>
          <ListItemText primary={option.label} />
          <Tooltip title="Mit KI umwandeln" placement="right">
            <IconButton
              size="small"
              className="ai-button"
              onClick={(e) => {
                e.stopPropagation();
                onAITransform(option.contentType);
              }}
              sx={{
                ml: 'auto',
                background: (theme) =>
                  `linear-gradient(to right, ${theme.palette.primary.main}, #3498DB)`,
                color: 'white',
                width: 28,
                height: 28,
                '&:hover': {
                  background: (theme) =>
                    `linear-gradient(to right, ${theme.palette.primary.dark}, #2980B9)`,
                },
              }}
            >
              <Iconify icon="solar:cup-star-bold" width={16} />
            </IconButton>
          </Tooltip>
        </MenuItem>
      ))}
    </Menu>
  );
}

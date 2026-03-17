import Menu from '@mui/material/Menu';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import { Iconify } from 'src/components/iconify';

import { commandOptions } from '../constants';

import type { CommandOption, CommandMenuState } from '../types';

// ----------------------------------------------------------------------

type CommandMenuProps = {
  menuState: CommandMenuState;
  onClose: () => void;
  onSelect: (option: CommandOption) => void;
  onAIButtonClick: (contentType: 'text' | 'multiple-choice', contentId: string | null) => void;
};

export function CommandMenu({ menuState, onClose, onSelect, onAIButtonClick }: CommandMenuProps) {
  return (
    <Menu anchorEl={menuState.anchor} open={Boolean(menuState.anchor)} onClose={onClose}>
      {commandOptions.map((option) => (
        <MenuItem
          key={option.id}
          onClick={() => onSelect(option)}
          sx={{
            display: 'flex',
            gap: 1,
            pr: 1,
            '& .ai-button': { opacity: 1 },
          }}
        >
          <ListItemIcon>
            <Iconify icon={option.icon} width={20} />
          </ListItemIcon>
          <ListItemText primary={option.label} secondary={option.description} />
          <Button
            className="ai-button"
            size="small"
            variant="contained"
            startIcon={<Iconify icon="solar:cup-star-bold" width={16} />}
            onClick={(e) => {
              e.stopPropagation();
              if (menuState.contentId) {
                if (option.contentType === 'multiple-choice') {
                  onAIButtonClick('multiple-choice', menuState.contentId);
                } else if (option.contentType === 'text') {
                  onAIButtonClick('text', menuState.contentId);
                }
              }
            }}
            sx={{
              ml: 'auto',
              minWidth: 'auto',
              flexShrink: 0,
              background: (theme) =>
                `linear-gradient(to right, ${theme.palette.primary.main}, #3498DB)`,
              color: 'white',
              '&:hover': {
                background: (theme) =>
                  `linear-gradient(to right, ${theme.palette.primary.dark}, #2980B9)`,
              },
            }}
          >
            AI
          </Button>
        </MenuItem>
      ))}
    </Menu>
  );
}

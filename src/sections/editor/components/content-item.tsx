import type { DragEvent } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

import type { Content, DropPosition } from '../types';

// ----------------------------------------------------------------------

type ContentItemProps = {
  item: Content;
  isActive: boolean;
  isDropTarget: boolean;
  dropPosition: DropPosition;
  onDelete: () => void;
  onAddBelow: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMenuOpen: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onDragStart: (e: DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
};

export function ContentItem({
  item,
  isActive,
  isDropTarget,
  dropPosition,
  onDelete,
  onAddBelow,
  onMenuOpen,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  children,
}: ContentItemProps) {
  const showDropIndicatorBefore = isDropTarget && dropPosition === 'before';
  const showDropIndicatorAfter = isDropTarget && dropPosition === 'after';

  return (
    <Box key={item.id} sx={{ position: 'relative' }}>
      {showDropIndicatorBefore && (
        <Box
          sx={{
            position: 'absolute',
            top: -4,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: 'primary.main',
            borderRadius: 1.5,
            zIndex: 10,
          }}
        />
      )}

      <Box
        onDragOver={onDragOver}
        onDrop={onDrop}
        sx={(theme) => ({
          display: 'flex',
          gap: 1,
          px: 1,
          py: 0.5,
          borderRadius: 2,
          backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
          transition: 'background-color 0.2s ease',
        })}
      >
        <Stack direction="row" spacing={0} alignItems="flex-start" sx={{ pt: 1.5 }}>
          <Tooltip title="Inhalt löschen">
            <IconButton size="small" onClick={onDelete}>
              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Inhalt darunter hinzufügen">
            <IconButton size="small" onClick={onAddBelow}>
              <Iconify icon="solar:add-circle-bold" width={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Ziehen zum Sortieren">
            <IconButton
              size="small"
              onClick={onMenuOpen}
              draggable
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              sx={{
                cursor: 'grab',
                '&:active': { cursor: 'grabbing' },
              }}
            >
              <Iconify icon="solar:list-bold" width={18} />
            </IconButton>
          </Tooltip>
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            flexGrow: 1,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            borderColor: 'transparent',
          }}
        >
          {children}
        </Paper>
      </Box>

      {showDropIndicatorAfter && (
        <Box
          sx={{
            position: 'absolute',
            bottom: -4,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: 'primary.main',
            borderRadius: 1.5,
            zIndex: 10,
          }}
        />
      )}
    </Box>
  );
}

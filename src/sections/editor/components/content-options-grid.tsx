import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { commandOptions } from '../constants';

import type { CommandOption } from '../types';

// ----------------------------------------------------------------------

type ContentOptionsGridProps = {
  onCreateContent: (option: CommandOption) => void;
  onOpenAiDialog: (contentType: 'text' | 'multiple-choice') => void;
};

export function ContentOptionsGrid({ onCreateContent, onOpenAiDialog }: ContentOptionsGridProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        py: 4,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 2,
          width: '100%',
        }}
      >
        {commandOptions.map((option) => (
          <Paper
            key={option.id}
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 1.5,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: (theme) => `0 2px 8px ${alpha(theme.palette.primary.main, 0.12)}`,
              },
            }}
            onClick={() => onCreateContent(option)}
          >
            <Stack spacing={1.5} alignItems="center">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.secondary',
                }}
              >
                <Iconify icon={option.icon} width={36} />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  textAlign: 'center',
                  color: 'text.primary',
                  fontSize: '0.875rem',
                }}
              >
                {option.label}
              </Typography>
              <Button
                fullWidth
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:cup-star-bold" width={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  if (option.contentType === 'multiple-choice') {
                    onOpenAiDialog('multiple-choice');
                  } else if (option.contentType === 'text') {
                    onOpenAiDialog('text');
                  }
                }}
                sx={{
                  fontSize: '0.75rem',
                  py: 0.5,
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
                  },
                }}
              >
                AI
              </Button>
            </Stack>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

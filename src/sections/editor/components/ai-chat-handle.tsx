import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type AIChatHandleProps = {
  onClick: () => void;
};

export function AIChatHandle({ onClick }: AIChatHandleProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'fixed',
        top: '50%',
        right: 0,
        transform: 'translateY(-50%)',
        width: 40,
        height: 120,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        boxShadow: 2,
        zIndex: 1000,
        transition: 'width 0.2s',
        '&:hover': {
          width: 45,
          boxShadow: 4,
        },
      }}
    >
      <Iconify icon="solar:cup-star-bold" width={24} sx={{ mb: 1 }} />
      <Typography
        variant="caption"
        sx={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontWeight: 'medium',
          fontSize: 12,
          letterSpacing: 1,
        }}
      >
        KI-CHAT
      </Typography>
    </Box>
  );
}

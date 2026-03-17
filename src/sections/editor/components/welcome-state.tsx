import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type WelcomeStateProps = {
  onStartGuidedCreation: () => void;
};

export function WelcomeState({ onStartGuidedCreation }: WelcomeStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        py: 8,
      }}
    >
      <Typography variant="h5" color="text.secondary">
        Bitte fügen Sie einen Titel hinzu, um zu beginnen
      </Typography>
      <Typography variant="body2" color="text.secondary">
        oder
      </Typography>
      <Button
        variant="contained"
        size="large"
        startIcon={<Iconify icon="solar:cup-star-bold" width={24} />}
        onClick={onStartGuidedCreation}
        sx={{
          background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, #3498DB)`,
          px: 4,
          py: 1.5,
          fontSize: '1rem',
          '&:hover': {
            background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark}, #2980B9)`,
          },
        }}
      >
        Mit KI-Assistent erstellen
      </Button>
    </Box>
  );
}

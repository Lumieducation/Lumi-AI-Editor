import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

import { PROVIDERS } from '../constants';

import type { ProviderType } from '../types';

// ----------------------------------------------------------------------

type EditorHeaderProps = {
  provider: ProviderType;
  apiEndpoint: string;
  apiToken: string;
  downloadLoading: boolean;
  hasContent: boolean;
  onProviderChange: (provider: ProviderType) => void;
  onEndpointChange: (endpoint: string) => void;
  onTokenChange: (token: string) => void;
  onDownload: () => void;
};

export function EditorHeader({
  provider,
  apiEndpoint,
  apiToken,
  downloadLoading,
  hasContent,
  onProviderChange,
  onEndpointChange,
  onTokenChange,
  onDownload,
}: EditorHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 3,
        py: 2,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="provider-select-label">Provider</InputLabel>
          <Select
            labelId="provider-select-label"
            value={provider}
            label="Provider"
            onChange={(e) => onProviderChange(e.target.value as ProviderType)}
          >
            {Object.entries(PROVIDERS).map(([key, config]) => (
              <MenuItem key={key} value={key}>
                {config.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="API Endpoint"
          value={apiEndpoint}
          onChange={(e) => onEndpointChange(e.target.value)}
          placeholder="https://api.openai.com/v1/chat/completions"
          sx={{ minWidth: 350 }}
        />
        <TextField
          size="small"
          label="API Token"
          type="password"
          value={apiToken}
          onChange={(e) => onTokenChange(e.target.value)}
          placeholder="Bearer token eingeben"
          sx={{ minWidth: 250 }}
          slotProps={{
            input: {
              startAdornment: (
                <Iconify icon="solar:shield-check-bold" width={20} sx={{ mr: 1, color: 'text.secondary' }} />
              ),
            },
          }}
        />
        {apiToken && (
          <Chip
            size="small"
            label="Konfiguriert"
            color="success"
            icon={<Iconify icon="solar:check-circle-bold" width={16} />}
          />
        )}
      </Stack>
      <Button
        variant="contained"
        startIcon={
          downloadLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <Iconify icon="solar:download-bold" />
          )
        }
        onClick={onDownload}
        disabled={!hasContent || downloadLoading}
      >
        {downloadLoading ? 'Wird vorbereitet...' : 'Herunterladen'}
      </Button>
    </Box>
  );
}

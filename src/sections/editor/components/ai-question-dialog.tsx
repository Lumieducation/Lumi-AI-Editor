import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

import type { AiDialogState } from '../types';

// ----------------------------------------------------------------------

type AIQuestionDialogProps = {
  dialogState: AiDialogState;
  apiToken: string;
  onClose: () => void;
  onContextChange: (context: string) => void;
  onGenerate: () => void;
};

export function AIQuestionDialog({
  dialogState,
  apiToken,
  onClose,
  onContextChange,
  onGenerate,
}: AIQuestionDialogProps) {
  return (
    <Dialog open={dialogState.open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="solar:cup-star-bold" width={24} />
          <span>Frage mit KI generieren</span>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Geben Sie den Kontext oder das Thema ein, aus dem Sie eine Frage generieren möchten. Die
            KI erstellt eine Single- oder Multiple-Choice-Frage basierend auf dem angegebenen
            Kontext.
          </Typography>
          <TextField
            label="Kontext"
            multiline
            rows={6}
            fullWidth
            value={dialogState.context}
            onChange={(e) => onContextChange(e.target.value)}
            placeholder="Geben Sie den Text oder das Thema ein, aus dem die KI eine Frage generieren soll..."
            disabled={dialogState.loading}
          />
          {!apiToken && (
            <Alert severity="warning">
              Bitte geben Sie Ihren API-Token in der Kopfzeile ein, bevor Sie Fragen generieren.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={dialogState.loading}>
          Abbrechen
        </Button>
        <Button
          variant="contained"
          onClick={onGenerate}
          disabled={dialogState.loading || !apiToken || !dialogState.context.trim()}
          startIcon={
            dialogState.loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <Iconify icon="solar:cup-star-bold" width={18} />
            )
          }
        >
          {dialogState.loading ? 'Wird generiert...' : 'Frage generieren'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

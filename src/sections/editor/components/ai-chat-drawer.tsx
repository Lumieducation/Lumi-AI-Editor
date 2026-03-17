import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import { alpha } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

import { drawerWidth } from '../constants';

import type { ChatMessage } from '../types';

// ----------------------------------------------------------------------

/** Splits a message into display text and suggestion chips (from [VORSCHLÄGE: ...] markers). */
function parseMessage(content: string): { text: string; suggestions: string[] } {
  const match = content.match(/\[VORSCHLÄGE:\s*(.+?)\]/s);
  if (!match) return { text: content.trim(), suggestions: [] };
  const suggestions = match[1].split('|').map((s) => s.trim()).filter(Boolean);
  const text = content.replace(match[0], '').trim();
  return { text, suggestions };
}

// ----------------------------------------------------------------------

type AIChatDrawerProps = {
  open: boolean;
  apiToken: string;
  chatMessages: ChatMessage[];
  chatInput: string;
  chatLoading: boolean;
  chatMessagesEndRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onChatInputChange: (value: string) => void;
  onSendMessage: () => void;
  onStartGuidedCreation: () => void;
  onSuggestionClick: (text: string) => void;
};

export function AIChatDrawer({
  open,
  apiToken,
  chatMessages,
  chatInput,
  chatLoading,
  chatMessagesEndRef,
  onClose,
  onChatInputChange,
  onSendMessage,
  onStartGuidedCreation,
  onSuggestionClick,
}: AIChatDrawerProps) {
  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
      variant="persistent"
      anchor="right"
      open={open}
    >
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">KI-Assistent</Typography>
          <IconButton onClick={onClose}>
            <Iconify icon="eva:arrow-ios-forward-fill" />
          </IconButton>
        </Box>

        {/* Chat Messages Area */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            backgroundColor: (theme) => alpha(theme.palette.grey[500], 0.04),
            borderRadius: 2,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {chatMessages.length === 0 ? (
            <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
              <Iconify icon="solar:cup-star-bold" width={48} sx={{ color: 'text.secondary' }} />
              <Typography color="text.secondary" textAlign="center" variant="body2">
                Bitte mich, dir bei deinem Arbeitsblatt zu helfen!
                <br />
                Ich kann Inhalte hinzufügen, Fragen beantworten und mehr.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={onStartGuidedCreation}
                startIcon={<Iconify icon="solar:cup-star-bold" width={18} />}
                disabled={!apiToken}
              >
                Geführte Erstellung starten
              </Button>
            </Stack>
          ) : (
            chatMessages.map((msg) => {
              const { text, suggestions } = parseMessage(msg.content);
              return (
                <Box
                  key={msg.id}
                  sx={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}
                >
                  <Paper
                    sx={{
                      p: 1.5,
                      backgroundColor: (theme) =>
                        msg.role === 'user'
                          ? theme.palette.primary.main
                          : theme.palette.background.paper,
                      color: (theme) =>
                        msg.role === 'user'
                          ? theme.palette.primary.contrastText
                          : theme.palette.text.primary,
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {text}
                    </Typography>
                  </Paper>

                  {suggestions.length > 0 && (
                    <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                      {suggestions.map((s) => (
                        <Chip
                          key={s}
                          label={s}
                          size="small"
                          variant="outlined"
                          onClick={() => onSuggestionClick(s)}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              );
            })
          )}

          {chatLoading && (
            <Box sx={{ alignSelf: 'flex-start' }}>
              <Paper
                sx={{
                  p: 1.5,
                  backgroundColor: (theme) => theme.palette.background.paper,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Denke nach...
                </Typography>
              </Paper>
            </Box>
          )}

          <div ref={chatMessagesEndRef} />
        </Box>

        {/* Chat Input */}
        <TextField
          fullWidth
          placeholder="Bitte die KI um Hilfe bei deinem Arbeitsblatt..."
          variant="outlined"
          size="small"
          value={chatInput}
          onChange={(e) => onChatInputChange(e.target.value)}
          disabled={chatLoading || !apiToken}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSendMessage();
            }
          }}
          sx={{ mt: 2 }}
          slotProps={{
            input: {
              endAdornment: (
                <IconButton
                  color="primary"
                  onClick={onSendMessage}
                  disabled={chatLoading || !apiToken || !chatInput.trim()}
                >
                  {chatLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Iconify icon="solar:forward-bold" />
                  )}
                </IconButton>
              ),
            },
          }}
        />
      </Box>
    </Drawer>
  );
}

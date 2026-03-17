import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';

import type { TextContent } from '../types';

// ----------------------------------------------------------------------

type TextContentProps = {
  item: TextContent;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (text: string) => void;
};

export function TextContentRenderer({
  item,
  isFocused,
  onFocus,
  onBlur,
  onChange,
}: TextContentProps) {
  const isEmpty = !item.text || item.text.trim() === '';

  if (isFocused) {
    return (
      <InputBase
        value={item.text || ''}
        multiline
        fullWidth
        autoFocus
        placeholder="Hier tippen..."
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        sx={{ fontSize: 16, lineHeight: 1.6, backgroundColor: 'transparent' }}
      />
    );
  }

  return (
    <Box
      onClick={onFocus}
      sx={{
        fontSize: 16,
        lineHeight: 1.6,
        cursor: 'text',
        minHeight: 24,
        color: isEmpty ? 'text.secondary' : 'text.primary',
      }}
    >
      {isEmpty ? 'Hier tippen...' : item.text}
    </Box>
  );
}

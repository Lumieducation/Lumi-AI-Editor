import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Checkbox from '@mui/material/Checkbox';
import InputBase from '@mui/material/InputBase';

import type { MultipleChoiceContent } from '../types';

// ----------------------------------------------------------------------

type MCQContentProps = {
  item: MultipleChoiceContent;
  isFocused: boolean;
  mcqTextValue: string;
  onFocus: (textValue: string) => void;
  onBlur: (textValue: string) => void;
  onChange: (textValue: string) => void;
  onAnswerToggle: (answerIndex: number, newCorrectValue: boolean) => void;
};

export function MCQContentRenderer({
  item,
  isFocused,
  mcqTextValue,
  onFocus,
  onBlur,
  onChange,
  onAnswerToggle,
}: MCQContentProps) {
  const isEmpty = !item.question || item.question.trim() === '';

  if (isFocused || isEmpty) {
    return (
      <InputBase
        value={isFocused ? mcqTextValue : ''}
        multiline
        fullWidth
        autoFocus={isEmpty}
        placeholder="Frage in der ersten Zeile\nAntwortoption 1\n*Richtige Antwort (mit * markieren)\nAntwortoption 2"
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          if (!isFocused) {
            onFocus(e.target.value);
          }
        }}
        onBlur={(e) => onBlur(e.target.value)}
        sx={{ fontSize: 16, lineHeight: 1.6, backgroundColor: 'transparent' }}
      />
    );
  }

  return (
    <Stack
      spacing={2}
      onClick={() => {
        onFocus('');
      }}
    >
      <Box sx={{ fontSize: 16, lineHeight: 1.6 }}>{item.question || ''}</Box>
      <Stack spacing={0}>
        {(item.answers || []).map((answer, answerIndex) => (
          <Box
            key={answerIndex}
            sx={(theme) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 0,
              py: 0,
              minHeight: 'auto',
              borderRadius: 1,
              border: `1px solid ${answer.correct ? theme.palette.success.main : theme.palette.divider}`,
              backgroundColor: answer.correct
                ? alpha(theme.palette.success.main, 0.1)
                : 'transparent',
            })}
          >
            <Checkbox
              checked={answer.correct}
              onChange={(e) => {
                e.stopPropagation();
                onAnswerToggle(answerIndex, !answer.correct);
              }}
              size="small"
              sx={{ py: 0 }}
            />
            <Box sx={{ flexGrow: 1, fontSize: 16, lineHeight: 1.6 }}>{answer.text || ''}</Box>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}

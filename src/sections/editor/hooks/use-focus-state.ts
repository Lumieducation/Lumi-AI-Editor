import * as React from 'react';

// ----------------------------------------------------------------------

export function useFocusState() {
  const [focusedTextId, setFocusedTextId] = React.useState<string | null>(null);
  const [focusedMCQId, setFocusedMCQId] = React.useState<string | null>(null);
  const [mcqTextValue, setMcqTextValue] = React.useState<string>('');

  return {
    focusedTextId,
    setFocusedTextId,
    focusedMCQId,
    setFocusedMCQId,
    mcqTextValue,
    setMcqTextValue,
  };
}

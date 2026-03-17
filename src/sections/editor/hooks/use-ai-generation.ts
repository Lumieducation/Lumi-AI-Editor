import * as React from 'react';

import { PROVIDERS } from '../constants';

import type {
  Content,
  TextContent,
  ProviderType,
  AiDialogState,
  SnackbarState,
  OpenAIChatMessage,
  MultipleChoiceContent,
} from '../types';

// ----------------------------------------------------------------------

export function useAiGeneration(
  provider: ProviderType,
  apiEndpoint: string,
  apiToken: string,
  content: Content[],
  setContent: (content: Content[]) => void,
  setSnackbar: (state: SnackbarState) => void
) {
  // AI Question Generation dialog
  const [aiDialog, setAiDialog] = React.useState<AiDialogState>({
    open: false,
    context: '',
    loading: false,
    targetContentId: null,
    mode: 'create',
  });

  // AI Text Generation dialog
  const [aiTextDialog, setAiTextDialog] = React.useState<AiDialogState>({
    open: false,
    context: '',
    loading: false,
    targetContentId: null,
    mode: 'create',
  });

  const handleOpenAiDialog = (targetContentId: string | null, mode: 'create' | 'addBelow') => {
    setAiDialog({
      open: true,
      context: '',
      loading: false,
      targetContentId,
      mode,
    });
  };

  const handleCloseAiDialog = () => {
    setAiDialog((prev) => ({ ...prev, open: false, context: '', loading: false }));
  };

  const handleOpenAiTextDialog = (targetContentId: string | null, mode: 'create' | 'addBelow') => {
    setAiTextDialog({
      open: true,
      context: '',
      loading: false,
      targetContentId,
      mode,
    });
  };

  const handleCloseAiTextDialog = () => {
    setAiTextDialog((prev) => ({ ...prev, open: false, context: '', loading: false }));
  };

  const handleGenerateQuestion = async () => {
    if (!apiToken.trim()) {
      setSnackbar({ open: true, message: 'Bitte geben Sie einen API-Token ein', severity: 'error' });
      return;
    }
    if (!aiDialog.context.trim()) {
      setSnackbar({
        open: true,
        message: 'Bitte geben Sie einen Kontext für die Frage ein',
        severity: 'error',
      });
      return;
    }

    setAiDialog((prev) => ({ ...prev, loading: true }));

    try {
      const prompt = `Erstelle eine Multiple-Choice-Frage basierend auf folgendem Kontext:

${aiDialog.context}

WICHTIG: Antworte NUR mit einem JSON-Objekt im folgenden Format (keine zusätzlichen Erklärungen):
{
  "question": "Die Frage hier",
  "answers": [
    {"text": "Antwort 1", "correct": false},
    {"text": "Richtige Antwort", "correct": true},
    {"text": "Antwort 3", "correct": false},
    {"text": "Antwort 4", "correct": false}
  ]
}

Die Frage und alle Antworten müssen auf Deutsch sein. Erstelle mindestens 2 und maximal 4 Antwortmöglichkeiten.`;

      const messages: OpenAIChatMessage[] = [{ role: 'user', content: prompt }];

      const requestBody: Record<string, unknown> = {
        messages,
        temperature: 0.7,
      };

      // Only include model for providers that require it
      if (PROVIDERS[provider].requiresModel) {
        requestBody.model = 'gpt-4';
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const assistantContent = data.choices?.[0]?.message?.content || '';

      // Parse JSON from response
      const jsonMatch = assistantContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Keine gültige JSON-Antwort vom API erhalten');
      }

      const parsedData = JSON.parse(jsonMatch[0]);

      // Create new multiple-choice content from the API response
      const newContent: MultipleChoiceContent = {
        id: `content-${Date.now()}`,
        type: 'multiple-choice',
        question: parsedData.question,
        answers: parsedData.answers,
      };

      if (aiDialog.mode === 'create') {
        // Add as first content item
        setContent(content.length === 0 ? [newContent] : [newContent, ...content]);
      } else if (aiDialog.mode === 'addBelow' && aiDialog.targetContentId) {
        // Add below the target content
        const targetIndex = content.findIndex((c) => c.id === aiDialog.targetContentId);
        const updatedContent = [...content];
        updatedContent.splice(targetIndex + 1, 0, newContent);
        setContent(updatedContent);
      }

      setSnackbar({
        open: true,
        message: 'Frage erfolgreich generiert',
        severity: 'success',
      });
      handleCloseAiDialog();
    } catch (error) {
      console.error('AI Generation error:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Fehler beim Generieren der Frage',
        severity: 'error',
      });
      setAiDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleGenerateText = async () => {
    if (!apiToken.trim()) {
      setSnackbar({ open: true, message: 'Bitte geben Sie einen API-Token ein', severity: 'error' });
      return;
    }
    if (!aiTextDialog.context.trim()) {
      setSnackbar({
        open: true,
        message: 'Bitte geben Sie einen Kontext für den Text ein',
        severity: 'error',
      });
      return;
    }

    setAiTextDialog((prev) => ({ ...prev, loading: true }));

    try {
      const prompt = `Erstelle einen informativen und lehrreichen Text basierend auf folgendem Kontext:

${aiTextDialog.context}

Der Text sollte:
- Auf Deutsch verfasst sein
- Gut strukturiert und verständlich sein
- Für Bildungszwecke geeignet sein
- 2-4 Absätze lang sein

Antworte NUR mit dem Text selbst, ohne zusätzliche Erklärungen oder Formatierung.`;

      const messages: OpenAIChatMessage[] = [{ role: 'user', content: prompt }];

      const requestBody: Record<string, unknown> = {
        messages,
        temperature: 0.7,
      };

      // Only include model for providers that require it
      if (PROVIDERS[provider].requiresModel) {
        requestBody.model = 'gpt-4';
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const assistantContent = data.choices?.[0]?.message?.content || '';

      // Create new text content from the API response
      const newContent: TextContent = {
        id: `content-${Date.now()}`,
        type: 'text',
        text: assistantContent.trim(),
      };

      if (aiTextDialog.mode === 'create') {
        // Add as first content item
        setContent(content.length === 0 ? [newContent] : [newContent, ...content]);
      } else if (aiTextDialog.mode === 'addBelow' && aiTextDialog.targetContentId) {
        // Add below the target content
        const targetIndex = content.findIndex((c) => c.id === aiTextDialog.targetContentId);
        const updatedContent = [...content];
        updatedContent.splice(targetIndex + 1, 0, newContent);
        setContent(updatedContent);
      }

      setSnackbar({
        open: true,
        message: 'Text erfolgreich generiert',
        severity: 'success',
      });
      handleCloseAiTextDialog();
    } catch (error) {
      console.error('AI Text Generation error:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Fehler beim Generieren des Textes',
        severity: 'error',
      });
      setAiTextDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return {
    aiDialog,
    setAiDialog,
    handleOpenAiDialog,
    handleCloseAiDialog,
    handleGenerateQuestion,
    aiTextDialog,
    setAiTextDialog,
    handleOpenAiTextDialog,
    handleCloseAiTextDialog,
    handleGenerateText,
  };
}

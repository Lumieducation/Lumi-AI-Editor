import * as React from 'react';

import { PROVIDERS } from '../constants';
import { buildWorksheetContext } from '../utils/worksheet-commands';

import type {
  Content,
  ChatMessage,
  ProviderType,
  CreationState,
  SnackbarState,
  WorksheetCommand,
  OpenAIChatMessage,
} from '../types';

// ----------------------------------------------------------------------

export function useAiChat(
  provider: ProviderType,
  apiEndpoint: string,
  apiToken: string,
  title: string,
  content: Content[],
  setContent: (content: Content[]) => void,
  setTitle: (title: string) => void,
  setSnackbar: (state: SnackbarState) => void,
  executeCommand: (command: WorksheetCommand) => void
) {
  const [chatDrawerOpen, setChatDrawerOpen] = React.useState(false);
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = React.useState('');
  const [chatLoading, setChatLoading] = React.useState(false);
  const chatMessagesEndRef = React.useRef<HTMLDivElement>(null);

  const [creationState, setCreationState] = React.useState<CreationState>({
    step: 'idle',
    topic: '',
    audience: '',
  });

  React.useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const makeMsg = (role: ChatMessage['role'], msgContent: string): ChatMessage => ({
    id: `msg-${Date.now()}`,
    role,
    content: msgContent,
    createdAt: Date.now(),
  });

  const startGuidedCreation = () => {
    if (!apiToken.trim()) {
      setSnackbar({ open: true, message: 'Bitte geben Sie Ihren API-Token ein', severity: 'error' });
      return;
    }
    setChatMessages([
      makeMsg('assistant', 'Hallo! Ich helfe dir beim Erstellen eines Arbeitsblatts. Lass uns mit den Grundlagen beginnen.\n\nWelches Thema soll dein Arbeitsblatt behandeln?'),
    ]);
    setCreationState({ step: 'asking_topic', topic: '', audience: '' });
    setChatDrawerOpen(true);
  };

  const handleSendChatMessage = async () => {
    if (!apiToken.trim()) {
      setSnackbar({ open: true, message: 'Bitte geben Sie Ihren API-Token ein', severity: 'error' });
      return;
    }
    if (!chatInput.trim()) return;

    const userMessage = makeMsg('user', chatInput);
    setChatMessages((prev) => [...prev, userMessage]);
    const userInput = chatInput;
    setChatInput('');
    setChatLoading(true);

    try {
      if (creationState.step === 'asking_topic') {
        setCreationState((prev) => ({ ...prev, step: 'asking_audience', topic: userInput }));
        setChatMessages((prev) => [
          ...prev,
          makeMsg('assistant', `Super! Dein Arbeitsblatt wird sich mit "${userInput}" befassen.\n\nWer ist die Zielgruppe?`),
        ]);
        setChatLoading(false);
        return;
      }

      if (creationState.step === 'asking_audience') {
        const { topic } = creationState;
        const audience = userInput;
        setCreationState((prev) => ({ ...prev, step: 'generating', audience }));
        setChatMessages((prev) => [
          ...prev,
          makeMsg('assistant', `Perfekt! Ich erstelle jetzt ein Arbeitsblatt über "${topic}" für ${audience}. Das kann einen Moment dauern...`),
        ]);

        const generatePrompt = `Du erstellst ein Bildungs-Arbeitsblatt für Thema: ${topic}, Zielgruppe: ${audience}.`;
        const messages: OpenAIChatMessage[] = [
          { role: 'system', content: generatePrompt },
          { role: 'user', content: `Erstelle ein Arbeitsblatt über "${topic}" für ${audience}.` },
        ];
        const requestBody: Record<string, unknown> = { messages, temperature: 0.7 };
        if (PROVIDERS[provider].requiresModel) requestBody.model = 'gpt-4';

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` },
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        const assistantContent = data.choices?.[0]?.message?.content || '';

        setContent([]);
        const jsonMatches = assistantContent.matchAll(/```json\n([\s\S]*?)\n```/g);
        let commandCount = 0;
        for (const match of jsonMatches) {
          try { executeCommand(JSON.parse(match[1])); commandCount++; } catch { /* ignore */ }
        }

        setChatMessages((prev) => [
          ...prev,
          makeMsg('assistant', commandCount > 0
            ? `Fertig! Ich habe einen Entwurf mit ${commandCount} Elementen erstellt.`
            : `Ideen generiert. ${assistantContent}`),
        ]);
        setCreationState({ step: 'done', topic, audience });
        setChatLoading(false);
        return;
      }

      const systemPrompt = `Du bist ein hilfreicher KI-Assistent für einen Arbeitsblatt-Editor.\n\n${buildWorksheetContext(title, content)}\n\nAntworte IMMER auf Deutsch.`;
      const messages: OpenAIChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...chatMessages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userInput },
      ];
      const requestBody: Record<string, unknown> = { messages, temperature: 0.7 };
      if (PROVIDERS[provider].requiresModel) requestBody.model = 'gpt-4';

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      const assistantContent = data.choices?.[0]?.message?.content || '';

      setChatMessages((prev) => [...prev, makeMsg('assistant', assistantContent)]);

      const jsonMatch = assistantContent.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try { executeCommand(JSON.parse(jsonMatch[1])); } catch { /* ignore */ }
      }
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        makeMsg('assistant', `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`),
      ]);
      if (creationState.step === 'generating') {
        setCreationState((prev) => ({ ...prev, step: 'asking_audience' }));
      }
    } finally {
      setChatLoading(false);
    }
  };

  return {
    chatDrawerOpen,
    setChatDrawerOpen,
    chatMessages,
    chatInput,
    setChatInput,
    chatLoading,
    chatMessagesEndRef,
    creationState,
    startGuidedCreation,
    handleSendChatMessage,
  };
}

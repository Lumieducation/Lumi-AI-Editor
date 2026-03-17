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

  // Scroll to bottom when new messages arrive
  React.useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const startGuidedCreation = () => {
    if (!apiToken.trim()) {
      setSnackbar({ open: true, message: 'Bitte geben Sie Ihren API-Token ein', severity: 'error' });
      return;
    }

    // Reset chat and start guided flow
    setChatMessages([
      {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content:
          'Hallo! Ich helfe dir beim Erstellen eines Arbeitsblatts. Lass uns mit den Grundlagen beginnen.\n\nWelches Thema soll dein Arbeitsblatt behandeln?',
      },
    ]);
    setCreationState({
      step: 'asking_topic',
      topic: '',
      audience: '',
    });
    setChatDrawerOpen(true);
  };

  const handleSendChatMessage = async () => {
    if (!apiToken.trim()) {
      setSnackbar({ open: true, message: 'Bitte geben Sie Ihren API-Token ein', severity: 'error' });
      return;
    }
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: chatInput,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    const userInput = chatInput;
    setChatInput('');
    setChatLoading(true);

    try {
      // Handle guided creation flow
      if (creationState.step === 'asking_topic') {
        // User provided topic, now ask for audience
        setCreationState((prev) => ({
          ...prev,
          step: 'asking_audience',
          topic: userInput,
        }));

        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `Super! Dein Arbeitsblatt wird sich mit "${userInput}" befassen.\n\nWer ist die Zielgruppe? (z.B. "Grundschüler", "Biologie-Oberstufenkurs", "Erwachsene Lernende", "Studierende im ersten Semester")`,
        };
        setChatMessages((prev) => [...prev, assistantMessage]);
        setChatLoading(false);
        return;
      }

      if (creationState.step === 'asking_audience') {
        // User provided audience, now generate the draft
        const topic = creationState.topic;
        const audience = userInput;

        setCreationState((prev) => ({
          ...prev,
          step: 'generating',
          audience,
        }));

        const generatingMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `Perfekt! Ich erstelle jetzt ein Arbeitsblatt über "${topic}" für ${audience}. Das kann einen Moment dauern...`,
        };
        setChatMessages((prev) => [...prev, generatingMessage]);

        // Generate the worksheet draft
        const generatePrompt = `Du erstellst ein Bildungs-Arbeitsblatt. Generiere einen vollständigen Arbeitsblatt-Entwurf basierend auf:

Thema: ${topic}
Zielgruppe: ${audience}

Erstelle ein Arbeitsblatt mit:
1. Einem passenden Titel
2. 2-3 Textblöcken, die das Thema zielgruppengerecht einführen und erklären
3. 2-3 Multiple-Choice-Fragen zum Verständnistest

WICHTIG: Alle Inhalte (Titel, Texte, Fragen, Antworten) MÜSSEN auf Deutsch sein!

Antworte mit mehreren JSON-Befehlsblöcken zum Aufbau des Arbeitsblatts. Verwende diese Formate:

Zuerst den Titel setzen:
\`\`\`json
{"action": "set_title", "title": "Dein Titel hier"}
\`\`\`

Dann Textblöcke hinzufügen:
\`\`\`json
{"action": "add_text", "text": "Dein erklärender Text hier..."}
\`\`\`

Dann Fragen hinzufügen:
\`\`\`json
{"action": "add_question", "question": "Deine Frage?", "answers": [{"text": "Falsche Antwort", "correct": false}, {"text": "Richtige Antwort", "correct": true}, {"text": "Weitere falsche Antwort", "correct": false}, {"text": "Noch eine falsche", "correct": false}]}
\`\`\`

Füge eine kurze Einleitung in natürlicher Sprache vor den Befehlen ein und eine Zusammenfassung danach. Antworte komplett auf Deutsch. Generiere jetzt das vollständige Arbeitsblatt.`;

        const messages: OpenAIChatMessage[] = [
          { role: 'system', content: generatePrompt },
          { role: 'user', content: `Erstelle ein Arbeitsblatt über "${topic}" für ${audience}.` },
        ];

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
        const assistantContent = data.choices?.[0]?.message?.content || 'No response';

        // Clear existing content before adding new draft
        setContent([]);

        // Parse and execute all commands in the response
        const jsonMatches = assistantContent.matchAll(/```json\n([\s\S]*?)\n```/g);
        let commandCount = 0;
        for (const match of jsonMatches) {
          try {
            const command = JSON.parse(match[1]);
            executeCommand(command);
            commandCount++;
          } catch (parseError) {
            console.error('Failed to parse command:', parseError);
          }
        }

        const doneMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content:
            commandCount > 0
              ? `Fertig! Ich habe einen Arbeitsblatt-Entwurf mit ${commandCount} Elementen erstellt. Du kannst jetzt:\n\n• Jeden Inhalt direkt im Editor bearbeiten\n• Mich bitten, mehr Inhalt hinzuzufügen\n• Mich bitten, bestimmte Teile zu ändern\n\nWas möchtest du als nächstes tun?`
              : `Ich habe einige Ideen für dein Arbeitsblatt generiert. ${assistantContent}\n\nMöchtest du, dass ich es nochmal versuche?`,
        };
        setChatMessages((prev) => [...prev, doneMessage]);

        setCreationState({
          step: 'done',
          topic,
          audience,
        });

        setChatLoading(false);
        return;
      }

      // Normal chat mode (after guided creation or free chat)
      const systemPrompt = `Du bist ein hilfreicher KI-Assistent für einen Arbeitsblatt-Editor. Du hilfst Nutzern beim Erstellen von Bildungs-Arbeitsblättern mit verschiedenen Inhaltstypen.

Der Nutzer arbeitet an einem Arbeitsblatt. Hier ist der aktuelle Stand:

${buildWorksheetContext(title, content)}

Du kannst dem Nutzer helfen durch:
1. Beantworten von Fragen zum Arbeitsblatt
2. Vorschlagen von Verbesserungen oder neuen Inhalten
3. Ändern des Arbeitsblatts auf Anfrage (du antwortest mit speziellen Befehlen)

Wenn der Nutzer dich bittet, Inhalte hinzuzufügen oder zu ändern, antworte mit einem JSON-Befehlsblock wie diesem:
\`\`\`json
{"action": "add_text", "text": "Dein Text hier"}
\`\`\`
oder
\`\`\`json
{"action": "add_question", "question": "Deine Frage", "answers": [{"text": "Antwort 1", "correct": true}, {"text": "Antwort 2", "correct": false}]}
\`\`\`
oder
\`\`\`json
{"action": "set_title", "title": "Neuer Titel"}
\`\`\`

WICHTIG: Antworte IMMER auf Deutsch. Alle generierten Inhalte (Texte, Fragen, Antworten) müssen auf Deutsch sein.

Erkläre immer in natürlicher Sprache, was du tust, vor oder nach dem Befehlsblock.`;

      const messages: OpenAIChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...chatMessages.map((msg) => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: userInput },
      ];

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
      const assistantContent = data.choices?.[0]?.message?.content || 'No response';

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: assistantContent,
      };

      setChatMessages((prev) => [...prev, assistantMessage]);

      // Parse and execute any commands in the response
      const jsonMatch = assistantContent.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          const command = JSON.parse(jsonMatch[1]);
          executeCommand(command);
        } catch (parseError) {
          console.error('Failed to parse command:', parseError);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
      };
      setChatMessages((prev) => [...prev, errorMessage]);

      // Reset creation state on error
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

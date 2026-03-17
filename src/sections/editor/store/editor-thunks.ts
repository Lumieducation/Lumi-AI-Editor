import type { RootState, AppDispatch } from 'src/state';

import { createAsyncThunk } from '@reduxjs/toolkit';

import { PROVIDERS } from '../constants';
import { buildWorksheetContext } from '../utils/worksheet-commands';
import { setTitle, setContent, addContent, addChatMessage } from './editor-slice';
import {
  selectTitle,
  selectContent,
  selectProvider,
  selectApiToken,
  selectApiEndpoint,
  selectChatMessages,
} from './editor-selectors';

import type {
  TextContent,
  ChatMessage,
  WorksheetCommand,
  OpenAIChatMessage,
  MultipleChoiceContent,
} from '../types';

// ----------------------------------------------------------------------

// AI Question Generation Thunk
export const generateQuestion = createAsyncThunk<
  MultipleChoiceContent,
  { context: string; mode: 'create' | 'addBelow' | 'transform'; targetContentId: string | null },
  { state: RootState; dispatch: AppDispatch }
>('editor/generateQuestion', async ({ context, mode }, { getState }) => {
  const state = getState();
  const provider = selectProvider(state);
  const apiEndpoint = selectApiEndpoint(state);
  const apiToken = selectApiToken(state);

  if (!apiToken.trim()) {
    throw new Error('Bitte geben Sie einen API-Token ein');
  }
  if (!context.trim()) {
    throw new Error('Bitte geben Sie einen Kontext für die Frage ein');
  }

  const prompt = mode === 'transform'
    ? `Wandle den folgenden Inhalt in eine Multiple-Choice-Frage um:

${context}

Behalte den Sinn und Inhalt bei, aber verwandle es in eine lehrreiche Multiple-Choice-Frage mit Antwortmöglichkeiten.

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

Die Frage und alle Antworten müssen auf Deutsch sein. Erstelle mindestens 2 und maximal 4 Antwortmöglichkeiten.`
    : `Erstelle eine Multiple-Choice-Frage basierend auf folgendem Kontext:

${context}

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

  const jsonMatch = assistantContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Keine gültige JSON-Antwort vom API erhalten');
  }

  const parsedData = JSON.parse(jsonMatch[0]);

  return {
    id: `content-${Date.now()}`,
    type: 'multiple-choice',
    question: parsedData.question,
    answers: parsedData.answers,
  };
});

// AI Text Generation Thunk
export const generateText = createAsyncThunk<
  TextContent,
  { context: string; mode: 'create' | 'addBelow' | 'transform'; targetContentId: string | null },
  { state: RootState; dispatch: AppDispatch }
>('editor/generateText', async ({ context, mode }, { getState }) => {
  const state = getState();
  const provider = selectProvider(state);
  const apiEndpoint = selectApiEndpoint(state);
  const apiToken = selectApiToken(state);

  if (!apiToken.trim()) {
    throw new Error('Bitte geben Sie einen API-Token ein');
  }
  if (!context.trim()) {
    throw new Error('Bitte geben Sie einen Kontext für den Text ein');
  }

  const prompt = mode === 'transform'
    ? `Wandle den folgenden Inhalt in einen informativen Text um:

${context}

Behalte den Kerninhalt und die Bedeutung bei, aber verwandle es in einen gut strukturierten, informativen Text.

Der Text sollte:
- Auf Deutsch verfasst sein
- Gut strukturiert und verständlich sein
- Für Bildungszwecke geeignet sein
- 2-4 Absätze lang sein

Antworte NUR mit dem Text selbst, ohne zusätzliche Erklärungen oder Formatierung.`
    : `Erstelle einen informativen und lehrreichen Text basierend auf folgendem Kontext:

${context}

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

  return {
    id: `content-${Date.now()}`,
    type: 'text',
    text: assistantContent.trim(),
  };
});

// Send Chat Message
export const sendChatMessage = createAsyncThunk<
  {
    assistantMessage: ChatMessage;
    commands?: WorksheetCommand[];
  },
  { userInput: string; creationState: any },
  { state: RootState; dispatch: AppDispatch }
>('editor/sendChatMessage', async ({ userInput, creationState }, { getState, dispatch }) => {
  const state = getState();
  const apiToken = selectApiToken(state);
  const provider = selectProvider(state);
  const apiEndpoint = selectApiEndpoint(state);
  const chatMessages = selectChatMessages(state);
  const title = selectTitle(state);
  const content = selectContent(state);

  if (!apiToken.trim()) {
    throw new Error('Bitte geben Sie Ihren API-Token ein');
  }
  if (!userInput.trim()) {
    throw new Error('Eingabe ist leer');
  }

  // Handle guided creation flow
  if (creationState.step === 'asking_topic') {
    return {
      assistantMessage: {
        id: `msg-${Date.now()}`,
        role: 'assistant' as const,
        content: `Super! Dein Arbeitsblatt wird sich mit "${userInput}" befassen.\n\nWer ist die Zielgruppe? (z.B. "Grundschüler", "Biologie-Oberstufenkurs", "Erwachsene Lernende", "Studierende im ersten Semester")`,
      },
    };
  }

  if (creationState.step === 'asking_audience') {
    const topic = creationState.topic;
    const audience = userInput;

    const generatingMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `Perfekt! Ich erstelle jetzt ein Arbeitsblatt über "${topic}" für ${audience}. Das kann einen Moment dauern...`,
    };
    dispatch(addChatMessage(generatingMessage));

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
    dispatch(setContent([]));

    // Parse and execute all commands
    const jsonMatches = assistantContent.matchAll(/```json\n([\s\S]*?)\n```/g);
    const commands: WorksheetCommand[] = [];
    for (const match of jsonMatches) {
      try {
        const command = JSON.parse(match[1]) as WorksheetCommand;
        commands.push(command);
        executeCommandSync(command, dispatch);
      } catch (parseError) {
        console.error('Failed to parse command:', parseError);
      }
    }

    return {
      assistantMessage: {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content:
          commands.length > 0
            ? `Fertig! Ich habe einen Arbeitsblatt-Entwurf mit ${commands.length} Elementen erstellt. Du kannst jetzt:\n\n• Jeden Inhalt direkt im Editor bearbeiten\n• Mich bitten, mehr Inhalt hinzuzufügen\n• Mich bitten, bestimmte Teile zu ändern\n\nWas möchtest du als nächstes tun?`
            : `Ich habe einige Ideen für dein Arbeitsblatt generiert. ${assistantContent}\n\nMöchtest du, dass ich es nochmal versuche?`,
      },
      commands,
    };
  }

  // Normal chat mode
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

  // Parse and execute any commands in the response
  const jsonMatch = assistantContent.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    try {
      const command = JSON.parse(jsonMatch[1]) as WorksheetCommand;
      executeCommandSync(command, dispatch);
    } catch (parseError) {
      console.error('Failed to parse command:', parseError);
    }
  }

  return {
    assistantMessage: {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: assistantContent,
    },
  };
});

// Helper function to execute commands synchronously within thunk
function executeCommandSync(command: WorksheetCommand, dispatch: AppDispatch) {
  switch (command.action) {
    case 'add_text':
      if (command.text) {
        const newTextContent: TextContent = {
          id: `content-${Date.now()}`,
          type: 'text',
          text: command.text,
        };
        dispatch(addContent(newTextContent));
      }
      break;
    case 'add_question':
      if (command.question && command.answers) {
        const newQuestionContent: MultipleChoiceContent = {
          id: `content-${Date.now()}`,
          type: 'multiple-choice',
          question: command.question,
          answers: command.answers,
        };
        dispatch(addContent(newQuestionContent));
      }
      break;
    case 'set_title':
      if (command.title) {
        dispatch(setTitle(command.title));
      }
      break;
    default:
      console.log('Unknown command:', command.action);
  }
}

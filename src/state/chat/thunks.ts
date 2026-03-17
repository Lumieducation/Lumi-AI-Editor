import type { RootState, AppDispatch } from 'src/state';
import type { Content } from 'src/state/lumi-editor/types';

import axios from 'axios';

import { buildSystemPrompt } from './prompts';
import { chatMessageAdded } from './actions';
import { CHAT_API_PENDING, CHAT_API_SETTLED } from './action-types';
import { selectApiToken, selectApiEndpoint, selectProvider, selectTitle, selectOrderedContent } from 'src/state/lumi-editor/lumiEditorSelectors';
import { worksheetTitleChanged, worksheetContentsSet } from 'src/state/lumi-editor/lumiEditorSlice';
import { PROVIDERS } from 'src/state/lumi-editor/providers';

// ----------------------------------------------------------------------

export const ASSISTANT_SENDER_ID = 'assistant';

// ----------------------------------------------------------------------

type WorksheetUpdatePayload = {
  title?: string;
  content?: Array<
    | { type: 'text'; text: string }
    | { type: 'multiple-choice'; question: string; answers: { text: string; correct: boolean }[] }
  >;
};

/** Strips [WORKSHEET_UPDATE: {...}] from raw AI output and attempts to parse
 *  the JSON payload. The block is always removed from the returned text, even
 *  when the JSON is malformed. */
function extractWorksheetBlock(raw: string): {
  displayText: string;
  payload: WorksheetUpdatePayload | null;
} {
  const blockStart = raw.indexOf('[WORKSHEET_UPDATE:');
  if (blockStart === -1) return { displayText: raw, payload: null };

  const jsonStart = raw.indexOf('{', blockStart);
  if (jsonStart === -1) return { displayText: raw, payload: null };

  // Walk forward counting braces to find the matching closing brace
  let depth = 0;
  let jsonEnd = -1;
  for (let i = jsonStart; i < raw.length; i++) {
    if (raw[i] === '{') depth++;
    else if (raw[i] === '}') {
      depth--;
      if (depth === 0) {
        jsonEnd = i;
        break;
      }
    }
  }

  // If braces are unbalanced, strip from marker start to end of string
  if (jsonEnd === -1) {
    return { displayText: raw.slice(0, blockStart).trim(), payload: null };
  }

  // Find the closing ] of the outer marker; if missing, strip to end of string
  const blockEnd = raw.indexOf(']', jsonEnd);
  const displayText = blockEnd === -1
    ? raw.slice(0, blockStart).trim()
    : (raw.slice(0, blockStart) + raw.slice(blockEnd + 1)).trim();

  try {
    const payload = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as WorksheetUpdatePayload;
    return { displayText, payload };
  } catch {
    console.warn('Failed to parse WORKSHEET_UPDATE JSON:', raw.slice(jsonStart, jsonEnd + 1));
    return { displayText, payload: null };
  }
}

function applyWorksheetUpdate(update: WorksheetUpdatePayload, dispatch: AppDispatch): void {
  if (update.title !== undefined) {
    dispatch(worksheetTitleChanged(update.title));
  }

  if (update.content !== undefined) {
    const newContent: Content[] = update.content.map((item) => {
      const id = crypto.randomUUID();
      if (item.type === 'text') {
        return { id, type: 'text' as const, text: item.text };
      }
      // multiple-choice
      return {
        id,
        type: 'multiple-choice' as const,
        question: item.question,
        answers: item.answers,
      };
    });
    dispatch(worksheetContentsSet(newContent));
  }
}

// ----------------------------------------------------------------------

export const sendMessage =
  (body: string, senderId: string) =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<void> => {
    dispatch({ type: CHAT_API_PENDING });
    dispatch(
      chatMessageAdded({
        id: crypto.randomUUID(),
        role: senderId === ASSISTANT_SENDER_ID ? 'assistant' : 'user',
        content: body,
        createdAt: Date.now(),
      })
    );

    try {
      const state = getState();
      const { messages } = state.chat;
      const apiToken = selectApiToken(state);
      const apiEndpoint = selectApiEndpoint(state);
      const provider = selectProvider(state);
      const title = selectTitle(state);
      const content = selectOrderedContent(state);

      const systemPrompt = buildSystemPrompt(title, content);
      const currentStateJson = JSON.stringify({ title, content });

      // Inject the current editor state into the last user message (API only, not stored in state)
      const openAiMessages = messages.map((msg, index) => {
        if (index === messages.length - 1 && msg.role === 'user') {
          return {
            role: msg.role,
            content: `${msg.content}\n\n[Aktueller Stand des Arbeitsblatts: ${currentStateJson}]`,
          };
        }
        return { role: msg.role, content: msg.content };
      });

      const requestBody: Record<string, unknown> = {
        messages: [{ role: 'system', content: systemPrompt }, ...openAiMessages],
      };

      if (PROVIDERS[provider].requiresModel) {
        requestBody.model = 'gpt-5.4';
      }

      const response = await axios.post(apiEndpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
      });

      const rawReply: string = response.data.choices[0].message.content;

      // Strip worksheet block from chat text and apply update if parseable
      const { displayText: reply, payload } = extractWorksheetBlock(rawReply);
      if (payload) {
        applyWorksheetUpdate(payload, dispatch);
      }

      dispatch(
        chatMessageAdded({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: reply,
          createdAt: Date.now(),
        })
      );
    } catch (error) {
      console.error('Chat API error:', error);
      dispatch(
        chatMessageAdded({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
          createdAt: Date.now(),
        })
      );
    } finally {
      dispatch({ type: CHAT_API_SETTLED });
    }
  };

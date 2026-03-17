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

function parseWorksheetUpdate(raw: string): WorksheetUpdatePayload | null {
  const match = raw.match(/\[WORKSHEET_UPDATE:\s*(\{[\s\S]*?\})\s*\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as WorksheetUpdatePayload;
  } catch {
    console.warn('Failed to parse WORKSHEET_UPDATE JSON:', match[1]);
    return null;
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

      const openAiMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const requestBody: Record<string, unknown> = {
        messages: [{ role: 'system', content: systemPrompt }, ...openAiMessages],
      };

      if (PROVIDERS[provider].requiresModel) {
        requestBody.model = 'gpt-4o';
      }

      const response = await axios.post(apiEndpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
      });

      const rawReply: string = response.data.choices[0].message.content;

      // Apply worksheet update if present
      const worksheetUpdate = parseWorksheetUpdate(rawReply);
      if (worksheetUpdate) {
        applyWorksheetUpdate(worksheetUpdate, dispatch);
      }

      // Strip markers before storing in chat
      const reply = rawReply
        .replace(/\[WORKSHEET_UPDATE:\s*\{[\s\S]*?\}\s*\]/g, '')
        .trim();

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

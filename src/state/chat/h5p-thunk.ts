import type { RootState, AppDispatch } from 'src/state';

import axios from 'axios';
import { uuidv4 } from 'minimal-shared/utils';

import { ASSISTANT_SENDER_ID } from './thunks';
import { H5P_GENERATION_PROMPT } from './h5p-prompt';
import { CHAT_H5P_ERROR, CHAT_H5P_GENERATED, CHAT_H5P_GENERATING } from './action-types';

// ----------------------------------------------------------------------

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/** Replace every "AUTO" subContentId in the parsed object with a real UUID. */
function assignUuids(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(assignUuids);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        k,
        k === 'subContentId' && v === 'AUTO' ? uuidv4() : assignUuids(v),
      ])
    );
  }
  return obj;
}

// ----------------------------------------------------------------------

export const generateH5p =
  () =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<void> => {
    dispatch({ type: CHAT_H5P_GENERATING });

    try {
      const { messages } = getState().chat;

      const conversationSummary = messages
        .map((m) => `${m.senderId === ASSISTANT_SENDER_ID ? 'Lumi' : 'Nutzer'}: ${m.body}`)
        .join('\n');

      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: 'gpt-5.2',
          messages: [
            { role: 'system', content: H5P_GENERATION_PROMPT },
            {
              role: 'user',
              content: `Erstelle ein H5P Interactive Book basierend auf diesem Gespräch:\n\n${conversationSummary}`,
            },
          ],
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
        }
      );

      const raw = JSON.parse(response.data.choices[0].message.content) as {
        title: string;
        content: unknown;
      };

      const contentWithUuids = assignUuids(raw.content);

      dispatch({
        type: CHAT_H5P_GENERATED,
        payload: {
          title: raw.title ?? 'Mein Lernbuch',
          contentJson: JSON.stringify(contentWithUuids),
        },
      });
    } catch (error) {
      console.error('H5P generation error:', error);
      dispatch({ type: CHAT_H5P_ERROR, payload: 'Das Lernbuch konnte leider nicht erstellt werden.' });
    }
  };

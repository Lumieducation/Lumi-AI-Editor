import type { RootState, AppDispatch } from 'src/state';

import axios from 'axios';

import { SYSTEM_PROMPT } from './prompts';
import { generateH5p } from './h5p-thunk';
import { updatePreview } from './preview-thunk';
import { chatSendMessage, chatReceiveMessage } from './actions';
import { CHAT_API_PENDING, CHAT_API_SETTLED } from './action-types';

// ----------------------------------------------------------------------

export const ASSISTANT_SENDER_ID = 'assistant';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// ----------------------------------------------------------------------

export const sendMessage =
  (body: string, senderId: string) =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<void> => {
    dispatch({ type: CHAT_API_PENDING });
    dispatch(chatSendMessage(body, senderId));

    try {
      const { messages } = getState().chat;

      const openAiMessages = messages.map((msg) => ({
        role: msg.senderId === ASSISTANT_SENDER_ID ? 'assistant' : 'user',
        content: msg.body,
      }));

      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: 'gpt-5.2',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...openAiMessages],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
        }
      );

      const rawReply: string = response.data.choices[0].message.content;
      const H5P_MARKER = '[H5P_BEREIT]';
      const hasH5pMarker = rawReply.includes(H5P_MARKER);
      const reply = rawReply.replace(H5P_MARKER, '').trim();
      dispatch(chatReceiveMessage(reply, ASSISTANT_SENDER_ID));
      dispatch(updatePreview() as any);
      if (hasH5pMarker) {
        dispatch(generateH5p() as any);
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
    } finally {
      dispatch({ type: CHAT_API_SETTLED });
    }
  };

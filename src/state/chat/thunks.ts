import type { RootState, AppDispatch } from 'src/state';

import axios from 'axios';

import { SYSTEM_PROMPT } from './prompts';
import { chatMessageAdded } from './actions';
import { CHAT_API_PENDING, CHAT_API_SETTLED } from './action-types';
import { selectApiToken, selectApiEndpoint, selectProvider } from 'src/state/lumi-editor/lumiEditorSelectors';
import { PROVIDERS } from 'src/state/lumi-editor/providers';

// ----------------------------------------------------------------------

export const ASSISTANT_SENDER_ID = 'assistant';

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

      const openAiMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const requestBody: Record<string, unknown> = {
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...openAiMessages],
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
      const H5P_MARKER = '[H5P_BEREIT]';
      const reply = rawReply.replace(H5P_MARKER, '').trim();

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

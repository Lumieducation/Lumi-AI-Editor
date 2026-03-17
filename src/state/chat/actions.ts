import type { ChatMessage } from './types';
import type { ChatSendMessageAction, ChatReceiveMessageAction } from './action-types';

import { uuidv4 } from 'minimal-shared/utils';
import { CHAT_MESSAGE_SEND, CHAT_MESSAGE_RECEIVED } from './action-types';

const buildMessage = (body: string, senderId: string): ChatMessage => ({
  id: uuidv4(),
  body,
  senderId,
  contentType: 'text',
  createdAt: Date.now(),
  attachments: [],
});

export const chatSendMessage = (body: string, senderId: string): ChatSendMessageAction => ({
  type: CHAT_MESSAGE_SEND,
  payload: buildMessage(body, senderId),
});

export const chatReceiveMessage = (body: string, senderId: string): ChatReceiveMessageAction => ({
  type: CHAT_MESSAGE_RECEIVED,
  payload: buildMessage(body, senderId),
});

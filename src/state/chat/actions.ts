import {
  CHAT_CLEARED,
  CHAT_MESSAGES_SET,
  CHAT_MESSAGE_ADDED,
} from './action-types';

import type { ChatMessage } from './types';
import type { ChatClearedAction, ChatMessagesSetAction, ChatMessageAddedAction } from './action-types';

export const chatMessageAdded = (message: ChatMessage): ChatMessageAddedAction => ({
  type: CHAT_MESSAGE_ADDED,
  payload: message,
});

export const chatMessagesSet = (messages: ChatMessage[]): ChatMessagesSetAction => ({
  type: CHAT_MESSAGES_SET,
  payload: messages,
});

export const chatCleared = (): ChatClearedAction => ({
  type: CHAT_CLEARED,
});

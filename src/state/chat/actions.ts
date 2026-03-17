import {
  CHAT_MESSAGE_ADDED,
  CHAT_MESSAGES_SET,
  CHAT_CLEARED,
} from './action-types';

import type { ChatMessage } from './types';
import type { ChatMessageAddedAction, ChatMessagesSetAction, ChatClearedAction } from './action-types';

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

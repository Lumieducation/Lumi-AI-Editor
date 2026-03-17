import type { ChatMessage, PreviewDocument } from './types';

export const CHAT_MESSAGE_ADDED = 'CHAT_MESSAGE_ADDED';
export const CHAT_MESSAGES_SET = 'CHAT_MESSAGES_SET';
export const CHAT_CLEARED = 'CHAT_CLEARED';
export const CHAT_API_PENDING = 'CHAT_API_PENDING';
export const CHAT_API_SETTLED = 'CHAT_API_SETTLED';
export const CHAT_H5P_GENERATING = 'CHAT_H5P_GENERATING';
export const CHAT_H5P_GENERATED = 'CHAT_H5P_GENERATED';
export const CHAT_H5P_ERROR = 'CHAT_H5P_ERROR';
export const CHAT_PREVIEW_UPDATED = 'CHAT_PREVIEW_UPDATED';

export interface ChatMessageAddedAction {
  type: typeof CHAT_MESSAGE_ADDED;
  payload: ChatMessage;
}

export interface ChatMessagesSetAction {
  type: typeof CHAT_MESSAGES_SET;
  payload: ChatMessage[];
}

export interface ChatClearedAction {
  type: typeof CHAT_CLEARED;
}

export interface ChatApiPendingAction {
  type: typeof CHAT_API_PENDING;
}

export interface ChatApiSettledAction {
  type: typeof CHAT_API_SETTLED;
}

export interface ChatH5pGeneratingAction {
  type: typeof CHAT_H5P_GENERATING;
}

export interface ChatH5pGeneratedAction {
  type: typeof CHAT_H5P_GENERATED;
  payload: { title: string; contentJson: string };
}

export interface ChatH5pErrorAction {
  type: typeof CHAT_H5P_ERROR;
  payload: string;
}

export interface ChatPreviewUpdatedAction {
  type: typeof CHAT_PREVIEW_UPDATED;
  payload: { markdown: string; doc: PreviewDocument };
}

export type ChatActionTypes =
  | ChatMessageAddedAction
  | ChatMessagesSetAction
  | ChatClearedAction
  | ChatApiPendingAction
  | ChatApiSettledAction
  | ChatH5pGeneratingAction
  | ChatH5pGeneratedAction
  | ChatH5pErrorAction
  | ChatPreviewUpdatedAction;

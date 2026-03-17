import type { ChatMessage, PreviewDocument } from './types';

export const CHAT_MESSAGE_SEND = 'CHAT_MESSAGE_SEND';
export const CHAT_MESSAGE_RECEIVED = 'CHAT_MESSAGE_RECEIVED';
export const CHAT_API_PENDING = 'CHAT_API_PENDING';
export const CHAT_API_SETTLED = 'CHAT_API_SETTLED';
export const CHAT_H5P_GENERATING = 'CHAT_H5P_GENERATING';
export const CHAT_H5P_GENERATED = 'CHAT_H5P_GENERATED';
export const CHAT_H5P_ERROR = 'CHAT_H5P_ERROR';
export const CHAT_PREVIEW_UPDATED = 'CHAT_PREVIEW_UPDATED';

export interface ChatSendMessageAction {
  type: typeof CHAT_MESSAGE_SEND;
  payload: ChatMessage;
}

export interface ChatReceiveMessageAction {
  type: typeof CHAT_MESSAGE_RECEIVED;
  payload: ChatMessage;
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
  | ChatSendMessageAction
  | ChatReceiveMessageAction
  | ChatApiPendingAction
  | ChatApiSettledAction
  | ChatH5pGeneratingAction
  | ChatH5pGeneratedAction
  | ChatH5pErrorAction
  | ChatPreviewUpdatedAction;

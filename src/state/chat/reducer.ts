import type * as ActionTypes from 'src/state/action-types';

import {
  CHAT_H5P_ERROR,
  CHAT_API_PENDING,
  CHAT_API_SETTLED,
  CHAT_MESSAGE_SEND,
  CHAT_H5P_GENERATED,
  CHAT_H5P_GENERATING,
  CHAT_PREVIEW_UPDATED,
  CHAT_MESSAGE_RECEIVED,
} from './action-types';

import type { ChatMessage, PreviewDocument } from './types';

export interface IChatState {
  messages: ChatMessage[];
  loading: boolean;
  h5pGenerating: boolean;
  h5pTitle: string | null;
  h5pContentJson: string | null;
  h5pError: string | null;
  preview: string;
  previewDoc: PreviewDocument | null;
}

export const initialState: IChatState = {
  messages: [],
  loading: false,
  h5pGenerating: false,
  h5pTitle: null,
  h5pContentJson: null,
  h5pError: null,
  preview: '',
  previewDoc: null,
};

export default function chatReducer(
  state: IChatState = initialState,
  action: ActionTypes.ActionTypes
): IChatState {
  switch (action.type) {
    case CHAT_MESSAGE_SEND:
    case CHAT_MESSAGE_RECEIVED:
      return { ...state, messages: [...state.messages, action.payload] };
    case CHAT_API_PENDING:
      return { ...state, loading: true };
    case CHAT_API_SETTLED:
      return { ...state, loading: false };
    case CHAT_H5P_GENERATING:
      return { ...state, h5pGenerating: true, h5pError: null };
    case CHAT_H5P_GENERATED:
      return {
        ...state,
        h5pGenerating: false,
        h5pTitle: action.payload.title,
        h5pContentJson: action.payload.contentJson,
      };
    case CHAT_H5P_ERROR:
      return { ...state, h5pGenerating: false, h5pError: action.payload };
    case CHAT_PREVIEW_UPDATED:
      return { ...state, preview: action.payload.markdown, previewDoc: action.payload.doc };
    default:
      return state;
  }
}

import type { RootState } from 'src/state';

export const selectChatMessages = (state: RootState) => state.chat.messages;
export const selectChatLoading = (state: RootState) => state.chat.loading;
export const selectH5pGenerating = (state: RootState) => state.chat.h5pGenerating;
export const selectH5pTitle = (state: RootState) => state.chat.h5pTitle;
export const selectH5pContentJson = (state: RootState) => state.chat.h5pContentJson;
export const selectH5pError = (state: RootState) => state.chat.h5pError;
export const selectChatPreview = (state: RootState) => state.chat.preview;
export const selectChatPreviewDoc = (state: RootState) => state.chat.previewDoc;

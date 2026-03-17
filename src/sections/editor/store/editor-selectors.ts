import type { RootState } from 'src/state';

import { createSelector } from '@reduxjs/toolkit';

import type { ContentType } from '../types';

// ----------------------------------------------------------------------

// Base selectors
export const selectEditorState = (state: RootState) => state.editor;

// API Config selectors
export const selectApiConfig = createSelector([selectEditorState], (editor) => editor.apiConfig);

export const selectProvider = createSelector([selectApiConfig], (config) => config.provider);

export const selectApiEndpoint = createSelector([selectApiConfig], (config) => config.apiEndpoint);

export const selectApiToken = createSelector([selectApiConfig], (config) => config.apiToken);

// Worksheet selectors
export const selectWorksheet = createSelector([selectEditorState], (editor) => editor.worksheet);

export const selectTitle = createSelector([selectWorksheet], (worksheet) => worksheet.title);

export const selectContent = createSelector([selectWorksheet], (worksheet) => worksheet.content);

export const selectHasContent = createSelector(
  [selectTitle, selectContent],
  (title, content) => content.length > 0 || title.trim() !== ''
);

export const selectContentById = createSelector(
  [selectContent, (_: RootState, id: string) => id],
  (content, id) => content.find((item) => item.id === id)
);

// Chat selectors
export const selectChat = createSelector([selectEditorState], (editor) => editor.chat);

export const selectChatMessages = createSelector([selectChat], (chat) => chat.messages);

// Helper to create content (not a selector, but useful utility)
export const createContentHelper = (type: ContentType) => {
  const id = `content-${Date.now()}`;
  switch (type) {
    case 'text':
      return { id, type: 'text' as const, text: '' };
    case 'multiple-choice':
      return {
        id,
        type: 'multiple-choice' as const,
        question: '',
        answers: [
          { text: '', correct: false },
          { text: '', correct: false },
        ],
      };
    default:
      return { id, type: 'text' as const, text: '' };
  }
};

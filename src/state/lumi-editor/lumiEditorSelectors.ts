import type { RootState } from 'src/state';

import { createSelector } from '@reduxjs/toolkit';

import type { ID, Content, ContentType } from './types';

// ----------------------------------------------------------------------

export const selectLumiEditorState = (state: RootState) => state.lumiEditor;

// API config
export const selectApiConfig = createSelector(
  [selectLumiEditorState],
  (editor) => editor.apiConfig
);

export const selectProvider = createSelector([selectApiConfig], (config) => config.provider);

export const selectApiEndpoint = createSelector([selectApiConfig], (config) => config.apiEndpoint);

export const selectApiToken = createSelector([selectApiConfig], (config) => config.apiToken);

// Worksheet
export const selectTitle = (state: RootState) => selectLumiEditorState(state).title;

export const selectContentMap = (state: RootState) => selectLumiEditorState(state).content;

export const selectStructure = (state: RootState) => selectLumiEditorState(state).structure;

export const selectWorksheetId = (state: RootState) => selectLumiEditorState(state).worksheetId;

export const selectOrderedContent = createSelector(
  [selectStructure, selectContentMap],
  (structure, contentMap): Content[] =>
    structure.map((id) => contentMap[id]).filter(Boolean) as Content[]
);

export const selectContentById = createSelector(
  [selectContentMap, (_: RootState, id: ID) => id],
  (contentMap, id): Content | undefined => contentMap[id]
);

export const selectHasContent = createSelector(
  [selectTitle, selectOrderedContent],
  (title, content) => content.length > 0 || title.trim() !== ''
);

export const selectHasAnyContent = createSelector(
  [selectLumiEditorState],
  (editor): boolean => {
    if (editor.title.trim().length > 0) return true;
    return editor.structure.some((id) => {
      const item = editor.content[id];
      if (!item) return false;
      return (
        (item.type === 'text' && item.text.trim().length > 0) ||
        (item.type === 'multiple-choice' &&
          (item.question.trim().length > 0 ||
            item.answers.some((a) => a.text.trim().length > 0))) ||
        (item.type === 'fill-in-the-blanks' && item.text.trim().length > 0) ||
        (item.type === 'freetext' && item.task.trim().length > 0)
      );
    });
  }
);

// UI state
export const selectContentLoading = (state: RootState, contentId: ID): boolean =>
  selectLumiEditorState(state).ui.loading[contentId] || false;

export const selectIsSaving = (state: RootState): boolean =>
  selectLumiEditorState(state).ui.saving || false;

export const selectTokenLimitError = (state: RootState): string | null | undefined =>
  selectLumiEditorState(state).ui.tokenLimitError;

// ----------------------------------------------------------------------
// Content factory helper (selector-adjacent utility)

export function createContentHelper(type: ContentType): Content {
  const id = `content-${Date.now()}`;
  switch (type) {
    case 'text':
      return { id, type: 'text', text: '' };
    case 'multiple-choice':
      return {
        id,
        type: 'multiple-choice',
        question: '',
        answers: [
          { text: '', correct: false },
          { text: '', correct: false },
        ],
      };
    case 'fill-in-the-blanks':
      return { id, type: 'fill-in-the-blanks', text: '' };
    case 'freetext':
      return { id, type: 'freetext', task: '' };
    default:
      return { id, type: 'text', text: '' };
  }
}

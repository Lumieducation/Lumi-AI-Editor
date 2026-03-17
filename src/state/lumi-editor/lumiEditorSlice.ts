import type { PayloadAction } from '@reduxjs/toolkit';

import { createSlice } from '@reduxjs/toolkit';

import type { ID, Content, TextContent, MultipleChoiceContent, FillInTheBlanks, Freetext, LumiEditorState, ProviderType } from './types';

import { PROVIDERS, DEFAULT_PROVIDER } from './providers';

// ----------------------------------------------------------------------

const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const storedProvider = loadFromLocalStorage<ProviderType>('api_provider', DEFAULT_PROVIDER);
const validProvider = PROVIDERS[storedProvider] ? storedProvider : DEFAULT_PROVIDER;

export const initialState: LumiEditorState = {
  apiConfig: {
    provider: validProvider,
    apiEndpoint: loadFromLocalStorage('api_endpoint', PROVIDERS[validProvider].endpoint),
    apiToken: loadFromLocalStorage('api_token', ''),
  },
  title: '',
  content: {},
  structure: [],
  ui: {
    loading: {},
  },
};

// ----------------------------------------------------------------------

export const lumiEditorSlice = createSlice({
  name: 'lumiEditor',
  initialState,
  reducers: {
    // API config
    providerChanged: (state, action: PayloadAction<ProviderType>) => {
      state.apiConfig.provider = action.payload;
      state.apiConfig.apiEndpoint = PROVIDERS[action.payload].endpoint;
    },
    apiEndpointChanged: (state, action: PayloadAction<string>) => {
      state.apiConfig.apiEndpoint = action.payload;
    },
    apiTokenChanged: (state, action: PayloadAction<string>) => {
      state.apiConfig.apiToken = action.payload;
    },

    // Worksheet
    worksheetReset: () => initialState,

    worksheetTitleChanged: (state, action: PayloadAction<string>) => {
      state.title = action.payload;
    },

    worksheetContentAdded: (state, action: PayloadAction<{ content: Content; index?: number }>) => {
      const { content, index } = action.payload;
      state.content[content.id] = content;
      if (index !== undefined && index >= 0 && index <= state.structure.length) {
        state.structure.splice(index, 0, content.id);
      } else {
        state.structure.push(content.id);
      }
    },

    worksheetContentUpdated: (
      state,
      action: PayloadAction<{ id: ID; updates: Partial<Content> }>
    ) => {
      const { id, updates } = action.payload;
      if (state.content[id]) {
        state.content[id] = { ...state.content[id], ...updates } as Content;
      }
    },

    worksheetContentDeleted: (state, action: PayloadAction<ID>) => {
      const id = action.payload;
      state.structure = state.structure.filter((sid) => sid !== id);
      delete state.content[id];
      delete state.ui.loading[id];
    },

    worksheetContentDuplicated: (state, action: PayloadAction<ID>) => {
      const id = action.payload;
      const item = state.content[id];
      if (!item) return;
      const newId = `content-${Date.now()}`;
      const duplicate = { ...item, id: newId };
      state.content[newId] = duplicate;
      const idx = state.structure.indexOf(id);
      state.structure.splice(idx + 1, 0, newId);
    },

    worksheetContentMoved: (state, action: PayloadAction<{ contentId: ID; toIndex: number }>) => {
      const { contentId, toIndex } = action.payload;
      const currentIndex = state.structure.indexOf(contentId);
      if (currentIndex === -1 || toIndex < 0 || toIndex >= state.structure.length) return;
      state.structure.splice(currentIndex, 1);
      state.structure.splice(toIndex, 0, contentId);
    },

    worksheetContentsSet: (state, action: PayloadAction<Content[]>) => {
      const newContent: LumiEditorState['content'] = {};
      const newStructure: ID[] = [];
      for (const item of action.payload) {
        newContent[item.id] = item;
        newStructure.push(item.id);
      }
      state.content = newContent;
      state.structure = newStructure;
    },

    worksheetStateImported: (_state, action: PayloadAction<LumiEditorState>) => action.payload,

    worksheetIdSet: (state, action: PayloadAction<string | null>) => {
      state.worksheetId = action.payload;
    },

    worksheetContentIdsUpdated: (state, action: PayloadAction<Record<string, string>>) => {
      const idMapping = action.payload;
      state.structure = state.structure.map((oldId) => idMapping[oldId] || oldId);
      const newContent: LumiEditorState['content'] = {};
      for (const [oldId, item] of Object.entries(state.content)) {
        const newId = idMapping[oldId] || oldId;
        newContent[newId] = { ...item, id: newId };
      }
      state.content = newContent;
      const newLoading: LumiEditorState['ui']['loading'] = {};
      for (const [oldId, loading] of Object.entries(state.ui.loading)) {
        const newId = idMapping[oldId] || oldId;
        newLoading[newId] = loading;
      }
      state.ui.loading = newLoading;
    },

    contentLoadingSet: (state, action: PayloadAction<{ contentId: ID; loading: boolean }>) => {
      state.ui.loading[action.payload.contentId] = action.payload.loading;
    },

    worksheetSavingSet: (state, action: PayloadAction<boolean>) => {
      state.ui.saving = action.payload;
    },

    tokenLimitErrorSet: (state, action: PayloadAction<string | null>) => {
      state.ui.tokenLimitError = action.payload;
    },

    tokenLimitErrorCleared: (state) => {
      state.ui.tokenLimitError = null;
    },
  },
});

export const {
  providerChanged,
  apiEndpointChanged,
  apiTokenChanged,
  worksheetReset,
  worksheetTitleChanged,
  worksheetContentAdded,
  worksheetContentUpdated,
  worksheetContentDeleted,
  worksheetContentDuplicated,
  worksheetContentMoved,
  worksheetContentsSet,
  worksheetStateImported,
  worksheetIdSet,
  worksheetContentIdsUpdated,
  contentLoadingSet,
  worksheetSavingSet,
  tokenLimitErrorSet,
  tokenLimitErrorCleared,
} = lumiEditorSlice.actions;

export default lumiEditorSlice.reducer;

// ----------------------------------------------------------------------
// Content factory helpers

export function createTextContent(text = ''): TextContent {
  return { id: crypto.randomUUID(), type: 'text', text };
}

export function createMultipleChoiceContent(
  question = '',
  answers: { correct: boolean; text: string }[] = [
    { correct: true, text: '' },
    { correct: false, text: '' },
  ]
): MultipleChoiceContent {
  return { id: crypto.randomUUID(), type: 'multiple-choice', question, answers };
}

export function createFillInTheBlanks(text = ''): FillInTheBlanks {
  return { id: crypto.randomUUID(), type: 'fill-in-the-blanks', text };
}

export function createFreetext(task = ''): Freetext {
  return { id: crypto.randomUUID(), type: 'freetext', task };
}

export function createContent(type: Content['type']): Content {
  switch (type) {
    case 'text':
      return createTextContent();
    case 'multiple-choice':
      return createMultipleChoiceContent();
    case 'fill-in-the-blanks':
      return createFillInTheBlanks();
    case 'freetext':
      return createFreetext();
    default:
      return createTextContent();
  }
}

import type { PayloadAction } from '@reduxjs/toolkit';

import { createSlice } from '@reduxjs/toolkit';

import { PROVIDERS, DEFAULT_PROVIDER } from '../constants';

import type { Content, ChatMessage, ProviderType } from '../types';

// ----------------------------------------------------------------------

// Helper to load from localStorage safely
const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Simplified state - only data, no UI state
export interface EditorState {
  // API Configuration (persisted)
  apiConfig: {
    provider: ProviderType;
    apiEndpoint: string;
    apiToken: string;
  };

  // Worksheet data
  worksheet: {
    title: string;
    content: Content[];
  };

  // Chat data
  chat: {
    messages: ChatMessage[];
  };
}

// Initialize from localStorage
const storedProvider = loadFromLocalStorage<ProviderType>('api_provider', DEFAULT_PROVIDER);
const validProvider = PROVIDERS[storedProvider] ? storedProvider : DEFAULT_PROVIDER;

const initialState: EditorState = {
  apiConfig: {
    provider: validProvider,
    apiEndpoint: loadFromLocalStorage('api_endpoint', PROVIDERS[validProvider].endpoint),
    apiToken: loadFromLocalStorage('api_token', ''),
  },

  worksheet: {
    title: '',
    content: [],
  },

  chat: {
    messages: [],
  },
};

// Slice
export const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    // API Config actions
    setProvider: (state, action: PayloadAction<ProviderType>) => {
      state.apiConfig.provider = action.payload;
      state.apiConfig.apiEndpoint = PROVIDERS[action.payload].endpoint;
    },
    setApiEndpoint: (state, action: PayloadAction<string>) => {
      state.apiConfig.apiEndpoint = action.payload;
    },
    setApiToken: (state, action: PayloadAction<string>) => {
      state.apiConfig.apiToken = action.payload;
    },

    // Worksheet actions
    setTitle: (state, action: PayloadAction<string>) => {
      state.worksheet.title = action.payload;
    },
    setContent: (state, action: PayloadAction<Content[]>) => {
      state.worksheet.content = action.payload;
    },
    addContent: (state, action: PayloadAction<Content>) => {
      state.worksheet.content.push(action.payload);
    },
    updateContent: (state, action: PayloadAction<{ id: string; updates: Partial<Content> }>) => {
      const { id, updates } = action.payload;
      const index = state.worksheet.content.findIndex((item) => item.id === id);
      if (index !== -1) {
        state.worksheet.content[index] = {
          ...state.worksheet.content[index],
          ...updates,
        } as Content;
      }
    },
    deleteContent: (state, action: PayloadAction<string>) => {
      state.worksheet.content = state.worksheet.content.filter(
        (item) => item.id !== action.payload
      );
    },
    duplicateContent: (state, action: PayloadAction<string>) => {
      const index = state.worksheet.content.findIndex((c) => c.id === action.payload);
      if (index !== -1) {
        const item = state.worksheet.content[index];
        const duplicated = { ...item, id: `content-${Date.now()}` };
        state.worksheet.content.splice(index + 1, 0, duplicated);
      }
    },
    insertContentAt: (state, action: PayloadAction<{ content: Content; index: number }>) => {
      const { content, index } = action.payload;
      state.worksheet.content.splice(index, 0, content);
    },
    reorderContent: (
      state,
      action: PayloadAction<{ sourceIndex: number; targetIndex: number }>
    ) => {
      const { sourceIndex, targetIndex } = action.payload;
      const [removed] = state.worksheet.content.splice(sourceIndex, 1);
      state.worksheet.content.splice(targetIndex, 0, removed);
    },

    // Chat actions
    addChatMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.chat.messages.push(action.payload);
    },
    setChatMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.chat.messages = action.payload;
    },
    clearChat: (state) => {
      state.chat.messages = [];
    },
  },
});

// Export actions
export const {
  setProvider,
  setApiEndpoint,
  setApiToken,
  setTitle,
  setContent,
  addContent,
  updateContent,
  deleteContent,
  duplicateContent,
  insertContentAt,
  reorderContent,
  addChatMessage,
  setChatMessages,
  clearChat,
} = editorSlice.actions;

export default editorSlice.reducer;

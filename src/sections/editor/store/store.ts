import type { Middleware } from '@reduxjs/toolkit';

import { configureStore } from '@reduxjs/toolkit';

import editorReducer from './editor-slice';

// ----------------------------------------------------------------------

// LocalStorage persistence middleware
const localStoragePersistenceMiddleware: Middleware = (store) => (next) => (action: any) => {
  const result = next(action);

  // Persist API config to localStorage when it changes
  const state = store.getState() as any;
  if (
    action.type === 'editor/setProvider' ||
    action.type === 'editor/setApiEndpoint' ||
    action.type === 'editor/setApiToken'
  ) {
    const { apiConfig } = state.editor;
    if (typeof window !== 'undefined') {
      localStorage.setItem('api_provider', apiConfig.provider);
      localStorage.setItem('api_endpoint', apiConfig.apiEndpoint);
      localStorage.setItem('api_token', apiConfig.apiToken);
    }
  }

  return result;
};

// Configure store
export const store = configureStore({
  reducer: {
    editor: editorReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(localStoragePersistenceMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

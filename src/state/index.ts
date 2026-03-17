import type { Middleware } from '@reduxjs/toolkit';

import { combineReducers } from 'redux';
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch as useReduxDispatch, useSelector as useReduxSelector } from 'react-redux';

import chatReducer from './chat/reducer';
import editorReducer from '../sections/editor/store/editor-slice';

// ----------------------------------------------------------------------

const localStoragePersistenceMiddleware: Middleware = (storeApi) => (next) => (action: any) => {
  const result = next(action);
  const state = storeApi.getState() as any;
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

const rootReducer = combineReducers({
  chat: chatReducer,
  editor: editorReducer,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(localStoragePersistenceMiddleware),
});

// const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

const { dispatch } = store;

export function setupStore(preloadedState?: any) {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(localStoragePersistenceMiddleware),
    preloadedState,
  });
}

export type AppStore = ReturnType<typeof setupStore>;

const useSelector = useReduxSelector;
const useDispatch = () => useReduxDispatch<AppDispatch>();

export { store, dispatch, useSelector, useDispatch };

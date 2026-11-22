import { configureStore, type Reducer } from '@reduxjs/toolkit'
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
  type PersistConfig,
} from 'redux-persist'
import storage from 'redux-persist/lib/storage'

import type { AuthState } from '@/types/auth.types'

import assistantReducer from './slices/assistantSlice'
import authReducer from './slices/authSlice'
import preferencesReducer, {
  type PreferencesState,
} from './slices/preferencesSlice'
import uiReducer from './slices/uiSlice'

const authPersistConfig: PersistConfig<AuthState> = {
  key: 'auth',
  storage,
  whitelist: ['user', 'accessToken', 'isAuthenticated'],
}

const preferencesPersistConfig: PersistConfig<PreferencesState> = {
  key: 'preferences',
  storage,
}

export const store = configureStore({
  reducer: {
    assistant: assistantReducer,
    auth: persistReducer(authPersistConfig, authReducer) as unknown as Reducer<AuthState>,
    preferences: persistReducer(
      preferencesPersistConfig,
      preferencesReducer,
    ) as unknown as Reducer<PreferencesState>,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

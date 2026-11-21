import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import i18n from '@/i18n'

export type ThemePreference = 'light' | 'dark' | 'system'
export type FontSizePreference = 'compact' | 'default' | 'comfortable' | 'large'
export type FontStylePreference = 'inter' | 'system' | 'noto-sans'
export type LanguagePreference = 'en' | 'hi'

export interface PreferencesState {
  theme: ThemePreference
  fontSize: FontSizePreference
  fontStyle: FontStylePreference
  language: LanguagePreference
}

const initialState: PreferencesState = {
  theme: 'light',
  fontSize: 'default',
  fontStyle: 'inter',
  language: 'en',
}

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemePreference>) => {
      state.theme = action.payload
    },
    setFontSize: (state, action: PayloadAction<FontSizePreference>) => {
      state.fontSize = action.payload
    },
    setFontStyle: (state, action: PayloadAction<FontStylePreference>) => {
      state.fontStyle = action.payload
    },
    setLanguage: (state, action: PayloadAction<LanguagePreference>) => {
      state.language = action.payload
      void i18n.changeLanguage(action.payload)
    },
  },
})

export const { setTheme, setFontSize, setFontStyle, setLanguage } = preferencesSlice.actions
export default preferencesSlice.reducer

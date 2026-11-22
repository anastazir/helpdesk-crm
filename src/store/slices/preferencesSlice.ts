import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import i18n from '@/i18n'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ColorThemePreference =
  | 'sovereign'
  | 'emerald'
  | 'violet'
  | 'rose'
  | 'amber'
  | 'teal'
export type FontSizePreference = 'compact' | 'default' | 'comfortable' | 'large'
export type FontStylePreference =
  | 'inter'
  | 'system'
  | 'noto-sans'
  | 'poppins'
  | 'roboto'
  | 'lato'
  | 'merriweather'
export type LanguagePreference = 'en' | 'hi'

export interface PreferencesState {
  theme: ThemePreference
  colorTheme: ColorThemePreference
  fontSize: FontSizePreference
  fontStyle: FontStylePreference
  language: LanguagePreference
}

const initialState: PreferencesState = {
  theme: 'light',
  colorTheme: 'sovereign',
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
    setColorTheme: (state, action: PayloadAction<ColorThemePreference>) => {
      state.colorTheme = action.payload
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

export const {
  setTheme,
  setColorTheme,
  setFontSize,
  setFontStyle,
  setLanguage,
} = preferencesSlice.actions
export default preferencesSlice.reducer

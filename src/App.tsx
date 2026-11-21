import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

import { TooltipProvider } from '@/components/ui/tooltip'
import AppRoutes from '@/routes'
import { useAppSelector } from '@/store/hooks'
import type { FontSizePreference, FontStylePreference } from '@/store/slices/preferencesSlice'

const FONT_SIZES: Record<FontSizePreference, string> = {
  compact: '14px',
  default: '16px',
  comfortable: '18px',
  large: '20px',
}

const FONT_STYLES: Record<FontStylePreference, string> = {
  inter: 'font-inter',
  system: 'font-sans',
  'noto-sans': 'font-noto-devanagari',
}

const App = () => {
  const { i18n } = useTranslation()
  const { theme, fontSize, fontStyle, language } = useAppSelector(
    (state) => state.preferences,
  )

  useEffect(() => {
    const root = document.documentElement

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const apply = (matches: boolean) => {
        root.classList.toggle('dark', matches)
      }
      apply(mediaQuery.matches)
      const listener = (event: MediaQueryListEvent) => apply(event.matches)
      mediaQuery.addEventListener('change', listener)
      return () => mediaQuery.removeEventListener('change', listener)
    }

    root.classList.toggle('dark', theme === 'dark')
    return undefined
  }, [theme])

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZES[fontSize]
  }, [fontSize])

  useEffect(() => {
    const classes = Object.values(FONT_STYLES)
    document.body.classList.remove(...classes)
    document.body.classList.add(FONT_STYLES[fontStyle])
  }, [fontStyle])

  useEffect(() => {
    document.documentElement.lang = language
    if (i18n.language !== language) {
      void i18n.changeLanguage(language)
    }
  }, [language, i18n])

  return (
    <BrowserRouter>
      <TooltipProvider>
        <AppRoutes />
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </BrowserRouter>
  )
}

export default App

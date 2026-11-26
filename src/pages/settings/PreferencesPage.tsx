import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Download } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import RoleBadge from '@/components/common/RoleBadge'
import AiSettingsCard from '@/components/settings/AiSettingsCard'
import WhatsAppSettingsCard from '@/components/settings/WhatsAppSettingsCard'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  setColorTheme,
  setFontSize,
  setFontStyle,
  setLanguage,
  setTheme,
  type ColorThemePreference,
  type FontSizePreference,
  type FontStylePreference,
  type LanguagePreference,
  type ThemePreference,
} from '@/store/slices/preferencesSlice'
import { cn } from '@/lib/utils'
import { getErrorMessage } from '@/utils/errors'
import { logger } from '@/utils/logger'

interface PreferencesFormValues {
  theme: ThemePreference
  colorTheme: ColorThemePreference
  fontSize: FontSizePreference
  fontStyle: FontStylePreference
  language: LanguagePreference
}

const COLOR_THEME_SWATCHES: Record<ColorThemePreference, string> = {
  sovereign: '#2563EB',
  emerald: '#10B981',
  violet: '#8B5CF6',
  rose: '#F43F5E',
  amber: '#D97706',
  teal: '#14B8A6',
}

const PreferencesPage = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAuth()
  const preferences = useAppSelector((state) => state.preferences)
  const { isInstallable, isInstalled, install } = usePwaInstall()
  const [installing, setInstalling] = useState(false)

  const schema = useMemo(
    () =>
      z.object({
        theme: z.enum(['light', 'dark', 'system']),
        colorTheme: z.enum([
          'sovereign',
          'emerald',
          'violet',
          'rose',
          'amber',
          'teal',
        ]),
        fontSize: z.enum(['compact', 'default', 'comfortable', 'large']),
        fontStyle: z.enum([
          'inter',
          'system',
          'noto-sans',
          'poppins',
          'roboto',
          'lato',
          'merriweather',
        ]),
        language: z.enum(['en', 'hi']),
      }),
    [],
  )

  const { control, handleSubmit } = useForm<PreferencesFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      theme: preferences.theme,
      colorTheme: preferences.colorTheme,
      fontSize: preferences.fontSize,
      fontStyle: preferences.fontStyle,
      language: preferences.language,
    },
  })

  const themes: { value: ThemePreference; label: string }[] = [
    { value: 'light', label: t('preferences.light') },
    { value: 'dark', label: t('preferences.dark') },
    { value: 'system', label: t('preferences.system') },
  ]

  const colorThemes: { value: ColorThemePreference; label: string }[] = [
    { value: 'sovereign', label: t('preferences.sovereign') },
    { value: 'emerald', label: t('preferences.emerald') },
    { value: 'violet', label: t('preferences.violet') },
    { value: 'rose', label: t('preferences.rose') },
    { value: 'amber', label: t('preferences.amber') },
    { value: 'teal', label: t('preferences.teal') },
  ]

  const fontSizes: { value: FontSizePreference; label: string }[] = [
    { value: 'compact', label: t('preferences.compact') },
    { value: 'default', label: t('preferences.default') },
    { value: 'comfortable', label: t('preferences.comfortable') },
    { value: 'large', label: t('preferences.large') },
  ]

  const languages: { value: LanguagePreference; label: string }[] = [
    { value: 'en', label: t('preferences.english') },
    { value: 'hi', label: t('preferences.hindi') },
  ]

  const save = (values: PreferencesFormValues) => {
    dispatch(setTheme(values.theme))
    dispatch(setColorTheme(values.colorTheme))
    dispatch(setFontSize(values.fontSize))
    dispatch(setFontStyle(values.fontStyle))
    dispatch(setLanguage(values.language))
    toast.success(t('preferences.saved'))
  }

  const installApp = async () => {
    setInstalling(true)
    try {
      const outcome = await install()
      if (outcome === 'accepted') {
        toast.success(t('preferences.installSuccess'))
      } else if (outcome === 'unavailable') {
        toast.info(t('preferences.installHint'))
      }
    } catch (installError) {
      logger.error('[PWA] Install prompt failed.', installError)
      toast.error(getErrorMessage(installError, t('errors.generic')))
    } finally {
      setInstalling(false)
    }
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t('preferences.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('preferences.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(save)} className="space-y-6">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>{t('preferences.appearance')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>{t('preferences.theme')}</Label>
              <Controller
                control={control}
                name="theme"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {themes.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={cn(
                          'rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                          field.value === option.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-white text-muted-foreground hover:bg-muted dark:bg-slate-900',
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('preferences.colorTheme')}</Label>
              <Controller
                control={control}
                name="colorTheme"
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {colorThemes.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={field.value === option.value}
                        onClick={() => field.onChange(option.value)}
                        className={cn(
                          'flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                          field.value === option.value
                            ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/20'
                            : 'border-border bg-white text-muted-foreground hover:bg-muted dark:bg-slate-900',
                        )}
                      >
                        <span
                          className="h-4 w-4 shrink-0 rounded-full"
                          style={{
                            backgroundColor: COLOR_THEME_SWATCHES[option.value],
                          }}
                        />
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('preferences.fontSize')}</Label>
              <Controller
                control={control}
                name="fontSize"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {fontSizes.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={cn(
                          'rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                          field.value === option.value
                            ? 'border-primary bg-blue-50 text-primary dark:bg-blue-950/40'
                            : 'border-border bg-white text-muted-foreground hover:bg-muted dark:bg-slate-900',
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('preferences.fontStyle')}</Label>
              <Controller
                control={control}
                name="fontStyle"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inter">{t('preferences.inter')}</SelectItem>
                      <SelectItem value="system">{t('preferences.systemFont')}</SelectItem>
                      <SelectItem value="noto-sans">{t('preferences.notoSans')}</SelectItem>
                      <SelectItem value="poppins">{t('preferences.poppins')}</SelectItem>
                      <SelectItem value="roboto">{t('preferences.roboto')}</SelectItem>
                      <SelectItem value="lato">{t('preferences.lato')}</SelectItem>
                      <SelectItem value="merriweather">
                        {t('preferences.merriweather')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>{t('preferences.language')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="language"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {languages.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        'rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                        field.value === option.value
                          ? 'border-primary bg-blue-50 text-primary dark:bg-blue-950/40'
                          : 'border-border bg-white text-muted-foreground hover:bg-muted dark:bg-slate-900',
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>{t('preferences.account')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('preferences.name')}
              </p>
              <p className="mt-1 text-sm font-medium">{user.full_name}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('preferences.email')}
              </p>
              <p className="mt-1 text-sm font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('preferences.role')}
              </p>
              <RoleBadge role={user.role} className="mt-1" />
            </div>
          </CardContent>
        </Card>

        <Button type="submit">{t('preferences.savePreferences')}</Button>
      </form>

      <AiSettingsCard />
      <WhatsAppSettingsCard />

      <Card className="mt-6 border-border shadow-sm">
        <CardHeader>
          <CardTitle>{t('preferences.installApp')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('preferences.installAppDescription')}
          </p>
          {isInstalled ? (
            <p className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              {t('preferences.installInstalled')}
            </p>
          ) : (
            <Button
              type="button"
              onClick={() => void installApp()}
              disabled={installing}
              title={!isInstallable ? t('preferences.installHint') : undefined}
            >
              <Download className="h-4 w-4" />
              {installing ? t('common.loading') : t('preferences.installButton')}
            </Button>
          )}
          {!isInstalled && (
            <p className="text-xs text-muted-foreground">
              {t('preferences.installHint')}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 border-border bg-slate-900 text-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-white">{t('preferences.preview')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium text-white">{t('preferences.previewTitle')}</p>
          <p className="mt-1 text-sm text-slate-300">{t('preferences.previewText')}</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default PreferencesPage

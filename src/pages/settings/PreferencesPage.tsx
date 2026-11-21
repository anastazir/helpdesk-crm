import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import RoleBadge from '@/components/common/RoleBadge'
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
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  setFontSize,
  setFontStyle,
  setLanguage,
  setTheme,
  type FontSizePreference,
  type FontStylePreference,
  type LanguagePreference,
  type ThemePreference,
} from '@/store/slices/preferencesSlice'
import { cn } from '@/lib/utils'

interface PreferencesFormValues {
  theme: ThemePreference
  fontSize: FontSizePreference
  fontStyle: FontStylePreference
  language: LanguagePreference
}

const PreferencesPage = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAuth()
  const preferences = useAppSelector((state) => state.preferences)

  const schema = useMemo(
    () =>
      z.object({
        theme: z.enum(['light', 'dark', 'system']),
        fontSize: z.enum(['compact', 'default', 'comfortable', 'large']),
        fontStyle: z.enum(['inter', 'system', 'noto-sans']),
        language: z.enum(['en', 'hi']),
      }),
    [],
  )

  const { control, handleSubmit } = useForm<PreferencesFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      theme: preferences.theme,
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
    dispatch(setFontSize(values.fontSize))
    dispatch(setFontStyle(values.fontStyle))
    dispatch(setLanguage(values.language))
    toast.success(t('preferences.saved'))
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

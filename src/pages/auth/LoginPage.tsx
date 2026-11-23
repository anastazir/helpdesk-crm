import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { BarChart3, ClipboardList, Headphones, Users } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { authApi } from '@/api/auth.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setCredentials, setError, setLoading } from '@/store/slices/authSlice'
import { ROLE_HOME } from '@/utils/constants'
import { getErrorMessage } from '@/utils/errors'
import { logger } from '@/utils/logger'

interface LoginFormValues {
  identifier: string
  password: string
}

const LoginPage = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user, loading, error } = useAuth()
  const accessToken = useAppSelector((state) => state.auth.accessToken)

  const schema = useMemo(
    () =>
      z.object({
        identifier: z.string().min(1, t('validation.required')),
        password: z.string().min(1, t('validation.required')),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '', password: '' },
  })

  if (isAuthenticated && user && accessToken) {
    return <Navigate to={ROLE_HOME[user.role]} replace />
  }

  const submit = async (values: LoginFormValues) => {
    dispatch(setLoading(true))
    dispatch(setError(null))
    try {
      logger.info('[LOGIN] Attempting login.')
      const response = await authApi.login(values.identifier, values.password)
      if (!response.success || !response.data) {
        throw new Error(response.message || t('auth.loginFailed'))
      }

      localStorage.setItem('refreshToken', response.data.refresh)
      const me = await authApi.me(response.data.access)
      if (!me.success || !me.data) {
        throw new Error(me.message || t('auth.loginFailed'))
      }

      dispatch(
        setCredentials({
          user: me.data,
          accessToken: response.data.access,
        }),
      )
      logger.info('[LOGIN] Login successful.', { role: me.data.role })
      toast.success(t('auth.loginSuccess'))
      navigate(ROLE_HOME[me.data.role], { replace: true })
    } catch (loginError) {
      logger.error('[LOGIN] Login failed.', loginError)
      const message = getErrorMessage(loginError, t('auth.loginFailed'))
      dispatch(setError(message))
      toast.error(message)
    } finally {
      dispatch(setLoading(false))
    }
  }

  const features = [
    { icon: ClipboardList, title: t('app.feature1Title'), text: t('app.feature1Description') },
    { icon: Users, title: t('app.feature2Title'), text: t('app.feature2Description') },
    { icon: BarChart3, title: t('app.feature3Title'), text: t('app.feature3Description') },
  ]

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-white lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/brand-logo.png"
              alt={t('app.name')}
              className="h-11 w-11 rounded-lg object-cover ring-1 ring-slate-700"
            />
            <div>
              <p className="text-lg font-semibold">{t('app.name')}</p>
              <p className="text-sm text-slate-400">{t('disclaimer.internal')}</p>
            </div>
          </div>

          <p className="mt-16 max-w-md text-2xl font-semibold leading-snug">
            {t('app.tagline')}
          </p>

          <div className="mt-10 space-y-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                    <Icon className="h-4 w-4 text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{feature.title}</p>
                    <p className="mt-0.5 text-sm text-slate-400">{feature.text}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Headphones className="h-4 w-4" />
          {t('app.name')}
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg border border-border bg-white p-8 shadow-sm dark:bg-slate-900">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              {t('auth.welcomeBack')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('auth.subtitle')}</p>
          </div>

          {error && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(submit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">{t('auth.emailOrPhone')}</Label>
              <Input
                id="login-email"
                type="text"
                autoComplete="email"
                placeholder={t('auth.emailOrPhonePlaceholder')}
                {...register('identifier')}
              />
              {errors.identifier && (
                <p className="text-sm text-red-600">{errors.identifier.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password">{t('auth.password')}</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder={t('auth.passwordPlaceholder')}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t('auth.contactAdmin')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2, MessageCircle, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { whatsappApi } from '@/api/whatsapp.api'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/hooks/useAuth'
import type {
  WhatsAppMeData,
  WhatsAppSettingsData,
} from '@/types/whatsapp.types'
import { getErrorMessage } from '@/utils/errors'
import { logger } from '@/utils/logger'

const formatPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  return phone
}

const WhatsAppSettingsCard = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isEngineer = user?.role === 'engineer'
  const [adminSettings, setAdminSettings] =
    useState<WhatsAppSettingsData | null>(null)
  const [engineerSettings, setEngineerSettings] =
    useState<WhatsAppMeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isAdmin && !isEngineer) return
    let cancelled = false
    setLoading(true)
    const request = isAdmin ? whatsappApi.getSettings() : whatsappApi.getMe()
    request
      .then((response) => {
        if (cancelled || !response.success || !response.data) return
        if (isAdmin) {
          setAdminSettings(response.data as WhatsAppSettingsData)
        } else {
          setEngineerSettings(response.data as WhatsAppMeData)
        }
      })
      .catch((error) => {
        logger.error('[WHATSAPP] Failed to load settings.', error)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isAdmin, isEngineer])

  if (!isAdmin && !isEngineer) return null

  if (loading && !adminSettings && !engineerSettings) {
    return (
      <Card className="mt-6 border-border shadow-sm">
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('common.loading')}
        </CardContent>
      </Card>
    )
  }

  if (isAdmin && adminSettings) {
    const toggle = async (next: boolean) => {
      setSaving(true)
      try {
        const response = await whatsappApi.updateSettings(next)
        if (!response.success || !response.data) {
          throw new Error(response.message || t('preferences.whatsappSaveFailed'))
        }
        setAdminSettings(response.data)
        toast.success(
          next
            ? t('preferences.whatsappTurnedOn')
            : t('preferences.whatsappTurnedOff'),
        )
      } catch (error) {
        logger.error('[WHATSAPP] Failed to update settings.', error)
        toast.error(getErrorMessage(error, t('preferences.whatsappSaveFailed')))
      } finally {
        setSaving(false)
      }
    }

    return (
      <Card className="mt-6 border-border shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              {t('preferences.whatsappIntegration')}
            </CardTitle>
            <Badge
              className={
                adminSettings.use_whatsapp
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }
            >
              {adminSettings.use_whatsapp
                ? t('preferences.whatsappOn')
                : t('preferences.whatsappOff')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('preferences.whatsappAdminDescription')}
          </p>
          <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium">
                {t('preferences.whatsappEnableFeature')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('preferences.whatsappEnableFeatureHint')}
              </p>
            </div>
            <Switch
              checked={adminSettings.use_whatsapp}
              onCheckedChange={(checked) => void toggle(checked)}
              disabled={saving}
              aria-label={t('preferences.whatsappEnableFeature')}
            />
          </div>
          {!adminSettings.server_enabled && (
            <p className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {t('preferences.whatsappServerDisabled')}
            </p>
          )}
          {adminSettings.server_enabled && !adminSettings.configured && (
            <p className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {t('preferences.whatsappNotConfigured')}
            </p>
          )}
          {!adminSettings.use_whatsapp && (
            <p className="text-xs text-muted-foreground">
              {t('preferences.whatsappDisabledHint')}
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  if (isEngineer && engineerSettings && engineerSettings.enabled) {
    const toggle = async (next: boolean) => {
      setSaving(true)
      try {
        const response = await whatsappApi.updateMe(next)
        if (!response.success || !response.data) {
          throw new Error(response.message || t('preferences.whatsappSaveFailed'))
        }
        setEngineerSettings(response.data)
        toast.success(t('preferences.whatsappConsentSaved'))
      } catch (error) {
        logger.error('[WHATSAPP] Failed to update consent.', error)
        toast.error(getErrorMessage(error, t('preferences.whatsappSaveFailed')))
      } finally {
        setSaving(false)
      }
    }

    return (
      <Card className="mt-6 border-border shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              {t('preferences.whatsappEngineerTitle')}
            </CardTitle>
            <Badge
              className={
                engineerSettings.whatsapp_opt_in
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }
            >
              {engineerSettings.whatsapp_opt_in
                ? t('preferences.whatsappEnabledStatus')
                : t('preferences.whatsappDisabledStatus')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('preferences.whatsappEngineerDescription')}
          </p>
          <div className="flex items-center gap-2 rounded-md border border-border p-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('preferences.whatsappNumber')}
              </p>
              <p className="text-sm font-medium">
                {engineerSettings.phone
                  ? formatPhone(engineerSettings.phone)
                  : t('preferences.whatsappNoPhone')}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium">
                {t('preferences.whatsappReceiveAlerts')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('preferences.whatsappReceiveAlertsHint')}
              </p>
            </div>
            <Switch
              checked={engineerSettings.whatsapp_opt_in}
              onCheckedChange={(checked) => void toggle(checked)}
              disabled={saving || !engineerSettings.can_opt_in}
              aria-label={t('preferences.whatsappReceiveAlerts')}
            />
          </div>
          {!engineerSettings.can_opt_in && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {t('preferences.whatsappNoPhoneHint')}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {t('preferences.whatsappStopHint')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return null
}

export default WhatsAppSettingsCard

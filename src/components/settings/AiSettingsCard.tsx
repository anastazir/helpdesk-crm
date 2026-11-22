import { useState } from 'react'
import { Bot, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { assistantSettingsApi } from '@/api/ai.api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setAssistantSettings } from '@/store/slices/assistantSlice'
import { getErrorMessage } from '@/utils/errors'
import { logger } from '@/utils/logger'

const AiSettingsCard = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const aiEnabled = useAppSelector((state) => state.assistant.aiEnabled)
  const [saving, setSaving] = useState(false)

  if (user?.role !== 'admin') return null

  const toggle = async () => {
    setSaving(true)
    try {
      const response = await assistantSettingsApi.update(!aiEnabled)
      if (!response.success || !response.data) {
        throw new Error(response.message || t('preferences.aiSaveFailed'))
      }
      dispatch(
        setAssistantSettings({
          aiEnabled: response.data.ai_enabled,
          loaded: true,
          canManage: response.data.can_manage,
        }),
      )
      toast.success(
        response.data.ai_enabled
          ? t('preferences.aiTurnedOn')
          : t('preferences.aiTurnedOff'),
      )
      logger.info('[AI SETTINGS] Updated.', {
        aiEnabled: response.data.ai_enabled,
      })
    } catch (error) {
      logger.error('[AI SETTINGS] Update failed.', error)
      toast.error(getErrorMessage(error, t('preferences.aiSaveFailed')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mt-6 border-border shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            {t('preferences.aiFeatures')}
          </CardTitle>
          <Badge
            className={
              aiEnabled
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }
          >
            {aiEnabled ? t('preferences.aiOn') : t('preferences.aiOff')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t('preferences.aiFeaturesDescription')}
        </p>
        <Button
          type="button"
          variant={aiEnabled ? 'outline' : 'default'}
          onClick={() => void toggle()}
          disabled={saving}
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {aiEnabled
            ? t('preferences.turnOffAi')
            : t('preferences.turnOnAi')}
        </Button>
        <p className="text-xs text-muted-foreground">
          {t('preferences.aiLogsRemain')}
        </p>
      </CardContent>
    </Card>
  )
}

export default AiSettingsCard

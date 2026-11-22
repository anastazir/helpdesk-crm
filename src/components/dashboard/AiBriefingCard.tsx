import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { aiApi, type BriefingResult } from '@/api/ai.api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getErrorMessage } from '@/utils/errors'
import { formatDate } from '@/utils/formatters'
import { logger } from '@/utils/logger'

const AiBriefingCard = () => {
  const { t } = useTranslation()
  const [result, setResult] = useState<BriefingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cost = result?.usage.cost
  const costLabel =
    cost === null || cost === undefined
      ? t('ai.costUnavailable')
      : `$${cost.toFixed(6)}`

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await aiApi.briefing()
      if (!response.success || !response.data) {
        throw new Error(response.message || t('ai.error'))
      }
      setResult(response.data)
      logger.info('[AI] Briefing generated.', {
        tokens: response.data.usage.total_tokens,
        cost: response.data.usage.cost,
      })
    } catch (requestError) {
      logger.error('[AI] Briefing request failed.', requestError)
      setError(getErrorMessage(requestError, t('ai.error')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-6 border-primary/20 bg-gradient-to-br from-primary/5 via-white to-transparent shadow-sm dark:via-slate-950">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              {t('ai.title')}
            </CardTitle>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
              {t('ai.poc')}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t('ai.subtitle')}</p>
        </div>
        <Button type="button" onClick={() => void generate()} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? t('ai.generating') : t('ai.generate')}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        {result ? (
          <>
            <div
              className="whitespace-pre-wrap rounded-lg border border-border bg-white p-4 text-sm leading-6 dark:bg-slate-900"
              aria-live="polite"
              data-testid="ai-briefing-result"
            >
              {result.briefing}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{t('ai.generated', { time: formatDate(result.generated_at) })}</span>
              <span>
                {t('ai.metadata', {
                  tokens: result.usage.total_tokens,
                  cost: costLabel,
                })}
              </span>
            </div>
          </>
        ) : (
          !loading && (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              {t('ai.empty')}
            </p>
          )
        )}

        {loading && !result && (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            {t('ai.generating')}
          </p>
        )}

        <p className="mt-3 text-xs text-muted-foreground">{t('ai.disclaimer')}</p>
      </CardContent>
    </Card>
  )
}

export default AiBriefingCard

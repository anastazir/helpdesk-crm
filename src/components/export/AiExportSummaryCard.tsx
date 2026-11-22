import { useEffect, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { assistantApi, type ExportSummaryResult } from '@/api/ai.api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ExportFilters } from '@/types/export.types'
import { getErrorMessage } from '@/utils/errors'
import { cleanAiText, formatInrCost } from '@/utils/formatters'
import { logger } from '@/utils/logger'

interface AiExportSummaryCardProps {
  filters: ExportFilters
  deduplicate: boolean
}

const AiExportSummaryCard = ({
  filters,
  deduplicate,
}: AiExportSummaryCardProps) => {
  const { t, i18n } = useTranslation()
  const [result, setResult] = useState<ExportSummaryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const filterKey = JSON.stringify({ filters, deduplicate })

  useEffect(() => {
    setResult(null)
    setError(null)
  }, [filterKey])

  const generate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const response = await assistantApi.exportSummary(
        filters,
        deduplicate,
        i18n.language,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || t('ai.export.error'))
      }
      setResult(response.data)
      logger.info('[AI EXPORT] Summary generated.', {
        tokens: response.data.usage.total_tokens,
      })
    } catch (requestError) {
      logger.error('[AI EXPORT] Request failed.', requestError)
      setError(getErrorMessage(requestError, t('ai.export.error')))
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
              {t('ai.export.title')}
            </CardTitle>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('ai.export.subtitle')}
          </p>
        </div>
        <Button type="button" onClick={() => void generate()} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? t('ai.export.generating') : t('ai.export.generate')}
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
              data-testid="ai-export-result"
            >
              {cleanAiText(result.text)}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{t('ai.export.disclaimer')}</span>
              <span>
                {t('ai.metadata', {
                  tokens: result.usage.total_tokens,
                  cost: formatInrCost(result.usage.cost_inr),
                })}
              </span>
            </div>
          </>
        ) : (
          !loading && (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              {t('ai.export.empty')}
            </p>
          )
        )}
        {loading && !result && (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            {t('ai.export.generating')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default AiExportSummaryCard

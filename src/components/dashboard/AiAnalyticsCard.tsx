import { useState } from 'react'
import { BarChart3, Loader2, Play, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  dashboardAnalyticsApi,
  type AnalyticsResult,
} from '@/api/ai.api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getErrorMessage } from '@/utils/errors'
import { formatInrCost } from '@/utils/formatters'
import { logger } from '@/utils/logger'

import AiMarkdown from '@/components/assistant/AiMarkdown'

import DynamicAiChart from './DynamicAiChart'

const SUGGESTED_QUESTIONS = [
  'Complaints created in the last 2 hours',
  'Complaints by zone this week',
  'Which engineers have the most active complaints?',
  'Show SLA risks by zone',
]

const AiAnalyticsCard = () => {
  const { t, i18n } = useTranslation()
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<AnalyticsResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = async (value = question) => {
    const prompt = value.trim()
    if (!prompt || loading) return
    setQuestion(prompt)
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const response = await dashboardAnalyticsApi.analyze(
        prompt,
        i18n.language,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || t('ai.analytics.error'))
      }
      setResult(response.data)
      logger.info('[AI ANALYTICS] Dashboard analysis received.', {
        rows: response.data.row_count,
        tokens: response.data.usage.total_tokens,
      })
    } catch (requestError) {
      logger.error('[AI ANALYTICS] Dashboard analysis failed.', requestError)
      setError(getErrorMessage(requestError, t('ai.analytics.error')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-6 min-w-0 border-primary/20 bg-gradient-to-br from-primary/5 via-white to-transparent shadow-sm dark:via-slate-950">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="h-5 w-5 text-primary" />
            {t('ai.analytics.title')}
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('ai.analytics.subtitle')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void analyze()
              }
            }}
            placeholder={t('ai.analytics.placeholder')}
            aria-label={t('ai.analytics.placeholder')}
          />
          <Button
            type="button"
            onClick={() => void analyze()}
            disabled={loading || !question.trim()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {loading ? t('ai.analytics.running') : t('ai.analytics.run')}
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              size="sm"
              variant="outline"
              className="h-auto max-w-full min-w-0 justify-start whitespace-normal text-left"
              onClick={() => void analyze(suggestion)}
              disabled={loading}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {suggestion}
            </Button>
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        {result ? (
          <div className="mt-5 space-y-4" data-testid="ai-analytics-result">
            <div>
              <h3 className="text-lg font-semibold">{result.title}</h3>
              {result.answer && (
                <AiMarkdown content={result.answer} className="mt-1 text-muted-foreground" />
              )}
            </div>
            <DynamicAiChart result={result} />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {t('ai.analytics.rows', {
                  count: result.row_count,
                  truncated: result.truncated ? t('ai.analytics.truncated') : '',
                })}
              </span>
              <span>
                {t('ai.metadata', {
                  tokens: result.usage.total_tokens,
                  cost: formatInrCost(result.usage.cost_inr),
                })}
              </span>
            </div>
            <details className="rounded-lg border border-border p-3">
              <summary className="cursor-pointer text-sm font-medium">
                {t('ai.analytics.showSql')}
              </summary>
              <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
                {result.sql}
              </pre>
            </details>
            <p className="text-xs text-muted-foreground">
              {t('ai.analytics.disclaimer')}
            </p>
          </div>
        ) : (
          !loading && (
            <p className="mt-4 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              {t('ai.analytics.empty')}
            </p>
          )
        )}
        {loading && !result && (
          <p className="mt-4 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            {t('ai.analytics.running')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default AiAnalyticsCard

import { useState } from 'react'
import { Loader2, Sparkles, Wand2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { aiApi, type TriageResult } from '@/api/ai.api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getErrorMessage } from '@/utils/errors'
import { logger } from '@/utils/logger'

interface AiTriageCardProps {
  issueIds: number[]
  othersDescription: string
  department: string
  designation: string
  onApply: (issueIds: number[]) => void
}

const urgencyClass = (urgency: TriageResult['urgency']) => {
  if (urgency === 'urgent') {
    return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
  }
  if (urgency === 'soon') {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
  }
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
}

const AiTriageCard = ({
  issueIds,
  othersDescription,
  department,
  designation,
  onApply,
}: AiTriageCardProps) => {
  const { t, i18n } = useTranslation()
  const [result, setResult] = useState<TriageResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasSymptoms = issueIds.length > 0 || othersDescription.trim().length > 0

  const suggest = async () => {
    if (!hasSymptoms) {
      setError(t('ai.triage.empty'))
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const response = await aiApi.triage({
        issue_ids: issueIds,
        others_description: othersDescription,
        department,
        designation,
        locale: i18n.language,
      })
      if (!response.success || !response.data) {
        throw new Error(response.message || t('ai.triage.error'))
      }
      setResult(response.data)
      logger.info('[AI TRIAGE] Suggestions received.', {
        urgency: response.data.urgency,
      })
    } catch (requestError) {
      logger.error('[AI TRIAGE] Request failed.', requestError)
      setError(getErrorMessage(requestError, t('ai.triage.error')))
    } finally {
      setLoading(false)
    }
  }

  const apply = () => {
    if (!result || result.suggested_issues.length === 0) return
    onApply(result.suggested_issues.map((issue) => issue.id))
    toast.success(t('ai.triage.applied'))
  }

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wand2 className="h-5 w-5 text-primary" />
              {t('ai.triage.title')}
            </CardTitle>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('ai.triage.subtitle')}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void suggest()}
          disabled={loading || !hasSymptoms}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? t('ai.triage.generating') : t('ai.triage.button')}
        </Button>
      </CardHeader>
      <CardContent>
        {!hasSymptoms && (
          <p className="text-sm text-muted-foreground">{t('ai.triage.empty')}</p>
        )}
        {error && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
        {result && (
          <div data-testid="ai-triage-result">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={urgencyClass(result.urgency)}>
                {t(`ai.triage.urgency.${result.urgency}`)}
              </Badge>
              {result.suggested_issues.map((issue) => (
                <span
                  key={issue.id}
                  className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  {issue.name}
                </span>
              ))}
            </div>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('ai.triage.reason')}
                </p>
                <p className="mt-1 leading-6">{result.reason}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('ai.triage.nextStep')}
                </p>
                <p className="mt-1 leading-6">{result.next_step}</p>
              </div>
            </div>
            {result.suggested_issues.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={apply}
              >
                {t('ai.triage.apply')}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AiTriageCard

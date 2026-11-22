import { useState } from 'react'
import {
  ClipboardList,
  Copy,
  Lightbulb,
  Loader2,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { aiApi, type CopilotResult } from '@/api/ai.api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getErrorMessage } from '@/utils/errors'
import { cleanAiText } from '@/utils/formatters'
import { logger } from '@/utils/logger'

interface AiComplaintCopilotProps {
  complaintId: number
  canDraft: boolean
}

const AiComplaintCopilot = ({
  complaintId,
  canDraft,
}: AiComplaintCopilotProps) => {
  const { t, i18n } = useTranslation()
  const [result, setResult] = useState<CopilotResult | null>(null)
  const [activeTask, setActiveTask] = useState<CopilotResult['task'] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (task: CopilotResult['task']) => {
    setLoading(true)
    setActiveTask(task)
    setResult(null)
    setError(null)
    try {
      const response = await aiApi.complaintCopilot(
        complaintId,
        task,
        i18n.language,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || t('ai.copilot.error'))
      }
      setResult(response.data)
      logger.info('[AI COPILOT] Response received.', { task })
    } catch (requestError) {
      logger.error('[AI COPILOT] Request failed.', requestError)
      setError(getErrorMessage(requestError, t('ai.copilot.error')))
    } finally {
      setLoading(false)
    }
  }

  const copyDraft = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(cleanAiText(result.text))
      toast.success(t('ai.copilot.copied'))
    } catch (copyError) {
      logger.error('[AI COPILOT] Clipboard write failed.', copyError)
      toast.error(t('ai.copilot.error'))
    }
  }

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('ai.copilot.title')}
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] uppercase">
            {t('ai.poc')}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('ai.copilot.subtitle')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void run('summary')}
            disabled={loading}
          >
            {loading && activeTask === 'summary' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ClipboardList className="h-4 w-4" />
            )}
            {t('ai.copilot.summary')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void run('next_action')}
            disabled={loading}
          >
            {loading && activeTask === 'next_action' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lightbulb className="h-4 w-4" />
            )}
            {t('ai.copilot.nextAction')}
          </Button>
          {canDraft && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void run('draft_comment')}
              disabled={loading}
            >
              {loading && activeTask === 'draft_comment' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              {t('ai.copilot.draft')}
            </Button>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        {result ? (
          <div className="mt-3">
            <div
              className="whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3 text-sm leading-6"
              data-testid="ai-copilot-result"
            >
              {cleanAiText(result.text)}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {t('ai.metadata', {
                  tokens: result.usage.total_tokens,
                  cost:
                    result.usage.cost === null ||
                    result.usage.cost === undefined
                      ? t('ai.costUnavailable')
                      : `$${result.usage.cost.toFixed(6)}`,
                })}
              </span>
              {result.task === 'draft_comment' && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void copyDraft()}
                >
                  <Copy className="h-4 w-4" />
                  {t('ai.copilot.copy')}
                </Button>
              )}
            </div>
            {result.task === 'draft_comment' && (
              <p className="text-xs text-muted-foreground">
                {t('ai.copilot.draftHint')}
              </p>
            )}
          </div>
        ) : (
          !loading && (
            <p className="mt-3 text-sm text-muted-foreground">
              {t('ai.copilot.empty')}
            </p>
          )
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          {t('ai.copilot.disclaimer')}
        </p>
      </CardContent>
    </Card>
  )
}

export default AiComplaintCopilot

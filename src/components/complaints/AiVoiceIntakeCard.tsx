import { useEffect, useState } from 'react'
import { Loader2, Mic, Sparkles, Square, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { assistantApi, type AutofillResult } from '@/api/ai.api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { getErrorMessage } from '@/utils/errors'
import { logger } from '@/utils/logger'

interface AiVoiceIntakeCardProps {
  onApply: (result: AutofillResult) => void
}

const AiVoiceIntakeCard = ({ onApply }: AiVoiceIntakeCardProps) => {
  const { t, i18n } = useTranslation()
  const [transcript, setTranscript] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const speechLanguage = i18n.language.startsWith('hi') ? 'hi-IN' : 'en-IN'
  const {
    supported,
    listening,
    interim,
    error: speechError,
    start,
    stop,
  } = useSpeechRecognition({
    language: speechLanguage,
    onFinalTranscript: (text) =>
      setTranscript((current) => `${current} ${text}`.trim()),
  })

  useEffect(() => {
    if (speechError) toast.error(speechError)
  }, [speechError])

  const autofill = async () => {
    if (!transcript.trim()) {
      setError(t('ai.autofill.empty'))
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await assistantApi.autofill(transcript, i18n.language)
      if (!response.success || !response.data) {
        throw new Error(response.message || t('ai.autofill.error'))
      }
      onApply(response.data)
      toast.success(t('ai.autofill.filled'))
      logger.info('[AI AUTOFILL] Form fields extracted.')
    } catch (requestError) {
      logger.error('[AI AUTOFILL] Request failed.', requestError)
      setError(getErrorMessage(requestError, t('ai.autofill.error')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 via-white to-transparent shadow-sm dark:via-slate-950">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              {t('ai.autofill.title')}
            </CardTitle>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('ai.autofill.subtitle')}
          </p>
        </div>
        <Button
          type="button"
          variant={listening ? 'destructive' : 'outline'}
          onClick={listening ? stop : start}
          disabled={!supported || loading}
        >
          {listening ? (
            <>
              <Square className="h-4 w-4 fill-current" />
              {t('speech.stop')}
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              {t('speech.start')}
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <Textarea
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          placeholder={t('ai.autofill.placeholder')}
          rows={4}
          className="resize-y"
          data-testid="ai-autofill-transcript"
        />
        {interim && (
          <p className="mt-2 text-sm italic text-muted-foreground">{interim}</p>
        )}
        {!supported && (
          <p className="mt-2 text-sm text-amber-600">{t('speech.unsupported')}</p>
        )}
        {error && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{t('ai.autofill.hint')}</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setTranscript('')
                setError(null)
              }}
              disabled={!transcript || loading}
            >
              <Trash2 className="h-4 w-4" />
              {t('common.clear')}
            </Button>
            <Button
              type="button"
              onClick={() => void autofill()}
              disabled={loading || !transcript.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loading ? t('ai.autofill.autofilling') : t('ai.autofill.autofill')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AiVoiceIntakeCard

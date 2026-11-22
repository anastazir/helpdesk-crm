import { useEffect } from 'react'
import { Mic, Square } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'

interface SpeechButtonProps {
  onTranscript: (text: string) => void
  language?: string
  disabled?: boolean
  className?: string
}

const SpeechButton = ({
  onTranscript,
  language = 'en-IN',
  disabled = false,
  className,
}: SpeechButtonProps) => {
  const { t } = useTranslation()
  const { supported, listening, error, toggle } = useSpeechRecognition({
    language,
    onFinalTranscript: onTranscript,
  })

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  if (!supported) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled
        title={t('speech.unsupported')}
        aria-label={t('speech.unsupported')}
        className={className}
      >
        <Mic className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggle}
      disabled={disabled}
      title={listening ? t('speech.stop') : t('speech.start')}
      aria-label={listening ? t('speech.stop') : t('speech.start')}
      className={className}
    >
      {listening ? (
        <Square className="h-4 w-4 fill-current text-red-600" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  )
}

export default SpeechButton

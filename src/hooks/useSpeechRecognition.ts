import { useEffect, useRef, useState } from 'react'

interface SpeechResultAlternative {
  transcript: string
}

interface SpeechResult {
  isFinal: boolean
  0: SpeechResultAlternative
}

interface SpeechResultList {
  length: number
  [index: number]: SpeechResult
}

interface SpeechResultEvent {
  resultIndex: number
  results: SpeechResultList
}

interface SpeechErrorEvent {
  error: string
}

interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: ((event: SpeechErrorEvent) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

interface SpeechWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

interface UseSpeechRecognitionOptions {
  language?: string
  onFinalTranscript?: (text: string) => void
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone permission was denied.',
  'service-not-allowed': 'Speech recognition is blocked in this browser.',
  'no-speech': 'No speech was detected. Try again.',
  network: 'Speech recognition needs a network connection.',
  'language-not-supported': 'This speech language is not available.',
  aborted: 'Speech recognition stopped.',
}

export const useSpeechRecognition = ({
  language = 'en-IN',
  onFinalTranscript,
}: UseSpeechRecognitionOptions = {}) => {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const callbackRef = useRef(onFinalTranscript)

  useEffect(() => {
    callbackRef.current = onFinalTranscript
  }, [onFinalTranscript])

  const supported =
    typeof window !== 'undefined' &&
    Boolean(
      (window as SpeechWindow).SpeechRecognition ||
        (window as SpeechWindow).webkitSpeechRecognition,
    )

  useEffect(
    () => () => {
      recognitionRef.current?.abort()
    },
    [],
  )

  const start = () => {
    if (!supported) {
      setError('Speech recognition is not supported in this browser.')
      return
    }
    recognitionRef.current?.abort()
    const SpeechRecognitionConstructor =
      (window as SpeechWindow).SpeechRecognition ||
      (window as SpeechWindow).webkitSpeechRecognition
    if (!SpeechRecognitionConstructor) return

    const recognition = new SpeechRecognitionConstructor()
    recognition.lang = language
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.onresult = (event) => {
      let interimText = ''
      let finalText = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const text = result[0]?.transcript ?? ''
        if (result.isFinal) finalText += `${text} `
        else interimText += text
      }
      setInterim(interimText)
      if (finalText.trim()) {
        callbackRef.current?.(finalText.trim())
        setInterim('')
      }
    }
    recognition.onerror = (event) => {
      setError(ERROR_MESSAGES[event.error] ?? 'Speech recognition failed.')
      setListening(false)
      setInterim('')
    }
    recognition.onend = () => {
      setListening(false)
      setInterim('')
    }
    recognitionRef.current = recognition
    setError(null)
    setInterim('')
    setListening(true)
    recognition.start()
  }

  const stop = () => {
    recognitionRef.current?.stop()
    setListening(false)
    setInterim('')
  }

  return {
    supported,
    listening,
    interim,
    error,
    start,
    stop,
    toggle: listening ? stop : start,
  }
}

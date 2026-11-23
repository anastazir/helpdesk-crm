import { useEffect, useRef, useState } from 'react'
import { Loader2, MessageCircle, Send, Sparkles, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  aiApi,
  type ChatHistoryItem,
  type ChatReference,
  type ChatStreamEvent,
} from '@/api/ai.api'
import AiMarkdown from '@/components/assistant/AiMarkdown'
import SpeechButton from '@/components/common/SpeechButton'
import { useAuth } from '@/hooks/useAuth'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setAiChatOpen } from '@/store/slices/uiSlice'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage } from '@/utils/errors'
import { formatInrCost } from '@/utils/formatters'
import { logger } from '@/utils/logger'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  references?: ChatReference[]
  tokens?: number
  costInr?: number | null
  streaming?: boolean
}

interface StreamStatus {
  key: string
  params?: Record<string, string | number>
}

const nextId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

const AiChatDrawer = () => {
  const { t, i18n } = useTranslation()
  const { user, accessToken } = useAuth()
  const dispatch = useAppDispatch()
  const open = useAppSelector((state) => state.ui.aiChatOpen)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamStatus, setStreamStatus] = useState<StreamStatus | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const endRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const setOpen = (next: boolean) => dispatch(setAiChatOpen(next))

  const promptKeys =
    user?.role === 'engineer'
      ? ['plan', 'oldest', 'next', 'sla']
      : ['today', 'sla', 'parts', 'unassigned']
  const complaintPath =
    user?.role === 'engineer' ? '/engineer/complaints' : '/complaints'

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading, streamStatus, open])

  useEffect(() => {
    if (!loading) {
      setElapsedSeconds(0)
      return
    }
    setElapsedSeconds(0)
    const timer = window.setInterval(
      () => setElapsedSeconds((current) => current + 1),
      1000,
    )
    return () => window.clearInterval(timer)
  }, [loading])

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || loading) return

    const history: ChatHistoryItem[] = messages
      .filter((item) => item.role === 'user' || item.role === 'assistant')
      .slice(-8)
      .map((item) => ({
        role: item.role,
        content: item.content.slice(0, 12000),
      }))

    const assistantId = nextId()
    setMessages((current) => [
      ...current,
      { id: nextId(), role: 'user', content: message },
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        streaming: true,
      },
    ])
    setInput('')
    setError(null)
    setStreamStatus({ key: 'ai.chat.status.thinking' })
    setLoading(true)

    const controller = new AbortController()
    abortRef.current = controller
    let streamedContent = ''
    let streamError: string | null = null

    const handleEvent = (event: ChatStreamEvent) => {
      if (event.type === 'status') {
        setStreamStatus({ key: event.key, params: event.params })
        return
      }
      if (event.type === 'token') {
        streamedContent += event.text
        setStreamStatus(null)
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantId
              ? { ...item, content: streamedContent }
              : item,
          ),
        )
        return
      }
      if (event.type === 'reset') {
        streamedContent = ''
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantId ? { ...item, content: '' } : item,
          ),
        )
        return
      }
      if (event.type === 'error') {
        streamError = event.message
        setStreamStatus(null)
        return
      }

      const data = event.data
      setStreamStatus(null)
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? {
                ...item,
                content: data.reply,
                references: data.references,
                tokens: data.usage.total_tokens,
                costInr: data.usage.cost_inr,
                streaming: false,
              }
            : item,
        ),
      )
      logger.info('[AI CHAT] Stream completed.', {
        tools: data.tools_used,
        tokens: data.usage.total_tokens,
      })
    }

    try {
      if (!accessToken) {
        throw new Error(t('ai.chat.error'))
      }
      await aiApi.chatStream(
        message,
        history,
        i18n.language,
        accessToken,
        handleEvent,
        controller.signal,
      )
      if (streamError) {
        throw new Error(streamError)
      }
    } catch (requestError) {
      if (
        !(requestError instanceof DOMException) ||
        requestError.name !== 'AbortError'
      ) {
        logger.error('[AI CHAT] Request failed.', requestError)
        setError(getErrorMessage(requestError, t('ai.chat.error')))
      }
      setMessages((current) =>
        current
          .filter(
            (item) =>
              item.id !== assistantId || item.content.trim().length > 0,
          )
          .map((item) =>
            item.streaming ? { ...item, streaming: false } : item,
          ),
      )
    } finally {
      abortRef.current = null
      setLoading(false)
      setStreamStatus(null)
      setMessages((current) =>
        current.map((item) =>
          item.streaming ? { ...item, streaming: false } : item,
        ),
      )
    }
  }

  return (
    <>
      {!open && (
        <Button
          type="button"
          className="fixed bottom-5 right-5 z-40 h-12 rounded-full px-5 shadow-lg md:hidden"
          onClick={() => setOpen(true)}
          aria-label={t('ai.chat.open')}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline">{t('ai.chat.open')}</span>
        </Button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-xl"
          data-testid="ai-chat-drawer"
        >
          <SheetHeader className="border-b border-border p-5 text-left">
            <div className="flex items-start justify-between gap-3">
              <div>
                <SheetTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {t('ai.chat.title')}
                </SheetTitle>
                <SheetDescription className="mt-1">
                  {t('ai.chat.subtitle')}
                </SheetDescription>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  abortRef.current?.abort()
                  setMessages([])
                  setError(null)
                  setStreamStatus(null)
                  setLoading(false)
                }}
                disabled={messages.length === 0 && !error}
                aria-label={t('ai.chat.clear')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5">
            {messages.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {t('ai.chat.suggested')}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('ai.chat.empty')}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {promptKeys.map((key) => (
                    <Button
                      key={key}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void send(t(`ai.chat.prompts.${key}`))
                      }
                    >
                      {t(`ai.chat.prompts.${key}`)}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4" aria-live="polite">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.role === 'user'
                        ? 'ml-8 rounded-lg bg-primary px-3 py-2 text-primary-foreground'
                        : 'mr-2 rounded-lg border border-border bg-muted/50 px-3 py-2'
                    }
                  >
                    {message.role === 'assistant' &&
                    message.streaming &&
                    !message.content ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>
                          {streamStatus
                            ? t(streamStatus.key, streamStatus.params)
                            : t('ai.chat.thinking')}
                        </span>
                        {elapsedSeconds >= 3 && (
                          <span className="ml-auto text-[11px] tabular-nums">
                            {elapsedSeconds}s
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <AiMarkdown content={message.content} />
                        {message.role === 'assistant' && message.streaming && (
                          <span className="ml-0.5 inline-block h-3.5 w-1 animate-pulse bg-current align-middle" />
                        )}
                      </>
                    )}
                    {message.role === 'assistant' &&
                      message.references &&
                      message.references.length > 0 && (
                        <div className="mt-3 border-t border-border/60 pt-2">
                          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            {t('ai.chat.references')}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {message.references.map((reference) => (
                              <Link
                                key={reference.id}
                                to={`${complaintPath}/${reference.id}`}
                                onClick={() => setOpen(false)}
                                className="rounded-full border border-border bg-background px-2 py-1 text-xs text-primary hover:underline"
                              >
                                {reference.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    {message.role === 'assistant' && message.tokens !== undefined && (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {t('ai.metadata', {
                          tokens: message.tokens,
                          cost: formatInrCost(message.costInr),
                        })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {error && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t('ai.chat.placeholder')}
                rows={2}
                className="min-h-10 resize-none"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void send(input)
                  }
                }}
              />
              <SpeechButton
                onTranscript={(text) =>
                  setInput((current) => `${current} ${text}`.trim())
                }
                language={i18n.language.startsWith('hi') ? 'hi-IN' : 'en-IN'}
                disabled={loading}
                className="h-10 w-10 shrink-0"
              />
              <Button
                type="button"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => void send(input)}
                disabled={loading || !input.trim()}
                aria-label={t('ai.chat.send')}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {t('ai.chat.readOnly')}
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export default AiChatDrawer

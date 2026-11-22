import { useEffect, useRef, useState } from 'react'
import { Loader2, MessageCircle, Send, Sparkles, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { aiApi, type ChatHistoryItem, type ChatReference } from '@/api/ai.api'
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
import { cleanAiText, formatInrCost } from '@/utils/formatters'
import { logger } from '@/utils/logger'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  references?: ChatReference[]
  tokens?: number
  costInr?: number | null
}

const nextId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

const AiChatDrawer = () => {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const open = useAppSelector((state) => state.ui.aiChatOpen)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
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
  }, [messages, loading, open])

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || loading) return

    const history: ChatHistoryItem[] = messages
      .filter((item) => item.role === 'user' || item.role === 'assistant')
      .slice(-10)
      .map((item) => ({ role: item.role, content: item.content }))

    setMessages((current) => [
      ...current,
      { id: nextId(), role: 'user', content: message },
    ])
    setInput('')
    setError(null)
    setLoading(true)
    try {
      const response = await aiApi.chat(message, history, i18n.language)
      if (!response.success || !response.data) {
        throw new Error(response.message || t('ai.chat.error'))
      }
      const data = response.data
      setMessages((current) => [
        ...current,
        {
          id: nextId(),
          role: 'assistant',
          content: data.reply,
          references: data.references,
          tokens: data.usage.total_tokens,
          costInr: data.usage.cost_inr,
        },
      ])
      logger.info('[AI CHAT] Reply received.', {
        tools: data.tools_used,
        tokens: data.usage.total_tokens,
      })
    } catch (requestError) {
      logger.error('[AI CHAT] Request failed.', requestError)
      setError(getErrorMessage(requestError, t('ai.chat.error')))
    } finally {
      setLoading(false)
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
                  setMessages([])
                  setError(null)
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
                    <p className="whitespace-pre-wrap text-sm leading-6">
                      {cleanAiText(message.content)}
                    </p>
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
                {loading && (
                  <div className="mr-2 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('ai.chat.thinking')}
                  </div>
                )}
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

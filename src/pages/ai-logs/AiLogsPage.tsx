import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Bot,
  Coins,
  FileSearch,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  aiLogsApi,
  type AIRequestLog,
  type AIRequestLogDetail,
  type AIRequestLogSummary,
} from '@/api/aiLogs.api'
import ErrorBanner from '@/components/common/ErrorBanner'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getErrorMessage } from '@/utils/errors'
import { formatDate, formatInrCost } from '@/utils/formatters'
import { logger } from '@/utils/logger'

const FEATURES = [
  'briefing',
  'chat',
  'complaint_copilot',
  'engineer_plan',
  'triage',
  'export_summary',
  'complaint_autofill',
  'analytics',
  'geocode',
]

const AiLogsPage = () => {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<AIRequestLog[]>([])
  const [summary, setSummary] = useState<AIRequestLogSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [feature, setFeature] = useState('')
  const [logStatus, setLogStatus] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<AIRequestLogDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const loadLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await aiLogsApi.list({
        page,
        page_size: 20,
        feature: feature || undefined,
        status: logStatus || undefined,
        search: debouncedSearch || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      if (!response.success || !response.data) {
        throw new Error(response.message || t('ai.logs.loadFailed'))
      }
      setLogs(response.data.results)
      setTotalPages(response.data.total_pages)
      setTotal(response.data.count)
    } catch (requestError) {
      logger.error('[AI LOGS] Load failed.', requestError)
      setError(getErrorMessage(requestError, t('ai.logs.loadFailed')))
    } finally {
      setLoading(false)
    }
  }

  const loadSummary = async () => {
    setSummaryLoading(true)
    try {
      const response = await aiLogsApi.summary()
      if (response.success && response.data) setSummary(response.data)
    } catch (requestError) {
      logger.error('[AI LOGS] Summary load failed.', requestError)
    } finally {
      setSummaryLoading(false)
    }
  }

  useEffect(() => {
    void loadLogs()
  }, [page, feature, logStatus, debouncedSearch, dateFrom, dateTo, t])

  useEffect(() => {
    void loadSummary()
  }, [])

  const reset = () => {
    setFeature('')
    setLogStatus('')
    setSearch('')
    setDebouncedSearch('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const openDetail = async (log: AIRequestLog) => {
    setSelectedId(log.id)
    setDetail(null)
    setDetailLoading(true)
    try {
      const response = await aiLogsApi.detail(log.id)
      if (!response.success || !response.data) {
        throw new Error(response.message || t('ai.logs.loadFailed'))
      }
      setDetail(response.data)
    } catch (requestError) {
      logger.error('[AI LOGS] Detail load failed.', requestError)
      toast.error(getErrorMessage(requestError, t('ai.logs.loadFailed')))
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={t('ai.logs.title')}
        description={t('ai.logs.subtitle')}
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void loadLogs()
              void loadSummary()
            }}
          >
            <RefreshCw className="h-4 w-4" />
            {t('common.refresh')}
          </Button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={() => void loadLogs()} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t('ai.logs.totalRequests')}
          value={summaryLoading ? '—' : (summary?.total_requests ?? 0)}
          hint={t('ai.logs.todayRequests') + `: ${summary?.today_requests ?? 0}`}
          icon={Bot}
        />
        <StatCard
          title={t('ai.logs.totalTokens')}
          value={summaryLoading ? '—' : (summary?.total_tokens ?? 0).toLocaleString()}
          icon={FileSearch}
        />
        <StatCard
          title={t('ai.logs.totalCost')}
          value={
            summaryLoading
              ? '—'
              : formatInrCost(summary?.total_cost_inr ?? 0)
          }
          hint={`${t('ai.logs.todayCost')}: ${formatInrCost(summary?.today_cost_inr ?? 0)}`}
          icon={Coins}
        />
        <StatCard
          title={t('ai.logs.errors')}
          value={summaryLoading ? '—' : (summary?.errors ?? 0)}
          icon={AlertTriangle}
          iconClassName="bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300"
        />
      </div>

      <Card className="mt-6 border-border shadow-sm">
        <CardHeader>
          <CardTitle>{t('ai.logs.filters')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder={t('ai.logs.searchPlaceholder')}
              className="pl-9"
            />
          </div>
          <select
            value={feature}
            onChange={(event) => {
              setFeature(event.target.value)
              setPage(1)
            }}
            className="h-10 min-w-[160px] rounded-md border border-input bg-background px-3 text-sm"
            aria-label={t('ai.logs.feature')}
          >
            <option value="">{t('ai.logs.allFeatures')}</option>
            {FEATURES.map((key) => (
              <option key={key} value={key}>
                {t(`ai.logs.features.${key}`)}
              </option>
            ))}
          </select>
          <select
            value={logStatus}
            onChange={(event) => {
              setLogStatus(event.target.value)
              setPage(1)
            }}
            className="h-10 min-w-[150px] rounded-md border border-input bg-background px-3 text-sm"
            aria-label={t('ai.logs.status')}
          >
            <option value="">{t('ai.logs.allStatuses')}</option>
            <option value="success">{t('ai.logs.success')}</option>
            <option value="error">{t('ai.logs.failure')}</option>
          </select>
          <Input
            type="date"
            className="w-[150px]"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value)
              setPage(1)
            }}
            aria-label={t('ai.logs.dateFrom')}
          />
          <div className="flex gap-2">
            <Input
              type="date"
              className="w-[150px]"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value)
                setPage(1)
              }}
              aria-label={t('ai.logs.dateTo')}
            />
            <Button type="button" variant="ghost" onClick={reset}>
              {t('common.reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 border-border shadow-sm">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{t('ai.logs.title')}</CardTitle>
          <span className="text-sm text-muted-foreground">
            {total} {t('ai.logs.totalRequests').toLowerCase()}
          </span>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">{t('ai.logs.empty')}</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('ai.logs.time')}</TableHead>
                      <TableHead>{t('ai.logs.user')}</TableHead>
                      <TableHead>{t('ai.logs.feature')}</TableHead>
                      <TableHead>{t('ai.logs.status')}</TableHead>
                      <TableHead className="text-right">{t('ai.logs.tokens')}</TableHead>
                      <TableHead className="text-right">{t('ai.logs.cost')}</TableHead>
                      <TableHead className="text-right">{t('ai.logs.latency')}</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{log.user_name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.user_email ?? '—'}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm">
                          {t(`ai.logs.features.${log.feature}`)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              log.status === 'success'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                            }
                          >
                            {log.status === 'success'
                              ? t('ai.logs.success')
                              : t('ai.logs.failure')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {log.total_tokens.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatInrCost(Number(log.cost_inr ?? 0))}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {log.latency_ms} ms
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => void openDetail(log)}
                          >
                            {t('ai.logs.view')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  {t('common.previous')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {Math.max(1, totalPages)}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  {t('common.next')}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null)
            setDetail(null)
          }
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{t('ai.logs.metadata')}</SheetTitle>
            <SheetDescription>
              {detail
                ? `${t(`ai.logs.features.${detail.feature}`)} · ${formatDate(detail.created_at)}`
                : '—'}
            </SheetDescription>
          </SheetHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center p-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : detail ? (
            <div className="mt-5 space-y-5 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{t('ai.logs.user')}</p>
                  <p>{detail.user_name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{detail.user_email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{t('ai.logs.cost')}</p>
                  <p>{formatInrCost(Number(detail.cost_inr ?? 0))}</p>
                  <p className="text-xs text-muted-foreground">
                    {detail.total_tokens.toLocaleString()} {t('ai.logs.tokens').toLowerCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Model</p>
                  <p className="break-all">{detail.model || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Provider</p>
                  <p>{detail.provider || '—'}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase text-muted-foreground">{t('ai.logs.tools')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {detail.tools_used.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    detail.tools_used.map((tool) => (
                      <Badge key={tool} variant="secondary">
                        {tool}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase text-muted-foreground">{t('ai.logs.requestDetails')}</p>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
                  {detail.request_text || '—'}
                </pre>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase text-muted-foreground">{t('ai.logs.responseDetails')}</p>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
                  {detail.response_text || '—'}
                </pre>
              </div>
              {detail.error_message && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  <p className="text-xs font-medium uppercase">{t('ai.logs.error')}</p>
                  <p className="mt-1 whitespace-pre-wrap">{detail.error_message}</p>
                </div>
              )}
              {Object.keys(detail.metadata).length > 0 && (
                <div>
                  <p className="mb-2 text-xs uppercase text-muted-foreground">{t('ai.logs.metadata')}</p>
                  <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
                    {JSON.stringify(detail.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default AiLogsPage

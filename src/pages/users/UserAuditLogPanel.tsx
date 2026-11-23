import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { usersApi } from '@/api/users.api'
import UserAuditExportCard from '@/components/export/UserAuditExportCard'
import { auditActionStyle } from '@/utils/auditColors'
import ErrorBanner from '@/components/common/ErrorBanner'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Pagination from '@/components/common/Pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { PaginatedData } from '@/types/api.types'
import type { UserAuditLog } from '@/types/auth.types'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/formatters'

const ACTION_OPTIONS = [
  '',
  'created',
  'updated',
  'password_changed',
  'disabled',
  'enabled',
  'deleted',
  'zone_added',
  'zone_removed',
]

const UserAuditLogPanel = () => {
  const { t } = useTranslation()
  const [data, setData] = useState<PaginatedData<UserAuditLog> | null>(null)
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await usersApi.auditLogs({
        action: action || undefined,
        search: search.trim() || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
        page_size: 20,
      })
      setData(response.data)
    } catch {
      setError(t('users.auditLoadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [page, action, search, dateFrom, dateTo])

  const reset = () => {
    setAction('')
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-white p-4 dark:bg-slate-900">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="audit-action">
            {t('users.auditAction')}
          </label>
          <select
            id="audit-action"
            value={action}
            onChange={(event) => {
              setAction(event.target.value)
              setPage(1)
            }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {ACTION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option ? t(`users.auditActions.${option}`) : t('users.allActions')}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="audit-search">
            {t('users.auditTargetSearch')}
          </label>
          <input
            id="audit-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder={t('users.auditTargetSearchPlaceholder')}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="audit-from">
            {t('filters.dateFrom')}
          </label>
          <input
            id="audit-from"
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value)
              setPage(1)
            }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="audit-to">
            {t('filters.dateTo')}
          </label>
          <input
            id="audit-to"
            type="date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value)
              setPage(1)
            }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <Button type="button" variant="outline" onClick={reset}>
          {t('common.reset')}
        </Button>
        <Button type="button" variant="ghost" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" />
          {t('common.refresh')}
        </Button>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => void load()} />}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border bg-white dark:bg-slate-900">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('users.auditTimestamp')}</TableHead>
                  <TableHead>{t('users.auditAction')}</TableHead>
                  <TableHead>{t('users.auditActor')}</TableHead>
                  <TableHead>{t('users.auditTarget')}</TableHead>
                  <TableHead>{t('users.auditChanges')}</TableHead>
                  <TableHead>{t('users.auditSource')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.results ?? []).map((log) => (
                  <TableRow
                    key={log.id}
                    className={auditActionStyle(log.action).row}
                  >
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'border',
                          auditActionStyle(log.action).badge,
                        )}
                      >
                        {t(`users.auditActions.${log.action}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <p className="font-medium">{log.actor_name || t('users.systemActor')}</p>
                      <p className="text-xs text-muted-foreground">{log.actor_email}</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      <p className="font-medium">{log.target_name}</p>
                      <p className="text-xs text-muted-foreground">{log.target_email}</p>
                    </TableCell>
                    <TableCell className="max-w-md whitespace-normal text-xs text-muted-foreground">
                      {Object.entries(log.changes ?? {})
                        .map(([field, value]) => {
                          if (value && typeof value === 'object' && 'new' in value) {
                            return `${field}: ${String((value as { old?: unknown }).old ?? '—')} → ${String((value as { new?: unknown }).new ?? '—')}`
                          }
                          return `${field}: ${String(value)}`
                        })
                        .join('; ')}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.source}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {data && (
            <Pagination
              page={data.page}
              totalPages={data.total_pages}
              count={data.count}
              pageSize={data.page_size}
              onPageChange={setPage}
            />
          )}
        </>
      )}
      <UserAuditExportCard />
    </div>
  )
}

export default UserAuditLogPanel

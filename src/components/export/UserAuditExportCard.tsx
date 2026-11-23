import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { exportApi } from '@/api/export.api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { auditActionStyle } from '@/utils/auditColors'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { getErrorMessage } from '@/utils/errors'

const UserAuditExportCard = () => {
  const { t } = useTranslation()
  const [action, setAction] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [preview, setPreview] = useState<{
    total: number
    rows: Record<string, string>[]
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const filters = {
    action: action || undefined,
    search: search.trim() || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  }

  const previewAudit = async () => {
    setLoading(true)
    try {
      const response = await exportApi.userAuditPreview(filters)
      setPreview({
        total: response.data?.total_matching ?? 0,
        rows: response.data?.rows ?? [],
      })
    } catch (error) {
      toast.error(getErrorMessage(error, t('export.auditPreviewFailed')))
    } finally {
      setLoading(false)
    }
  }

  const downloadAudit = async () => {
    setLoading(true)
    try {
      await exportApi.userAuditDownload(filters)
      toast.success(t('export.auditDownloadStarted'))
    } catch (error) {
      toast.error(getErrorMessage(error, t('export.auditDownloadFailed')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-6 border-border shadow-sm" id="user-audit">
      <CardHeader>
        <CardTitle>{t('export.userAuditTitle')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('export.userAuditDescription')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="audit-export-action">{t('users.auditAction')}</Label>
            <select
              id="audit-export-action"
              value={action}
              onChange={(event) => setAction(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{t('users.allActions')}</option>
              {[
                'created',
                'updated',
                'password_changed',
                'disabled',
                'enabled',
                'deleted',
                'zone_added',
                'zone_removed',
              ].map((value) => (
                <option key={value} value={value}>
                  {t(`users.auditActions.${value}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audit-export-search">{t('users.auditTargetSearch')}</Label>
            <Input
              id="audit-export-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('users.auditTargetSearchPlaceholder')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audit-export-from">{t('filters.dateFrom')}</Label>
            <Input
              id="audit-export-from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audit-export-to">{t('filters.dateTo')}</Label>
            <Input
              id="audit-export-to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" onClick={() => void previewAudit()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('export.auditPreview')}
          </Button>
          <Button type="button" onClick={() => void downloadAudit()} disabled={loading}>
            <Download className="h-4 w-4" />
            {t('export.downloadExcel')}
          </Button>
          {preview !== null && (
            <span className="text-sm text-muted-foreground">
              {t('export.auditPreviewCount', { count: preview.total })}
            </span>
          )}
        </div>
        {preview !== null && (
          <div className="overflow-x-auto rounded-lg border border-border">
            {preview.rows.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                {t('users.noAuditEvents')}
              </p>
            ) : (
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
                  {preview.rows.map((row, index) => (
                    <TableRow
                      key={`${row.timestamp}-${index}`}
                      className={auditActionStyle(row.action_key ?? row.action).row}
                    >
                      <TableCell className="whitespace-nowrap text-xs">
                        {row.timestamp}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-xs font-medium',
                            auditActionStyle(row.action_key ?? row.action).badge,
                          )}
                        >
                          {t(`users.auditActions.${row.action_key ?? row.action}`)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{row.actor_name}</TableCell>
                      <TableCell className="text-xs">{row.target_name}</TableCell>
                      <TableCell className="max-w-sm whitespace-normal text-xs">
                        {row.changed_fields || '—'}
                      </TableCell>
                      <TableCell className="text-xs">{row.source}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default UserAuditExportCard

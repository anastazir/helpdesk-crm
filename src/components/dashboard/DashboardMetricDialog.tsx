import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { complaintsApi } from '@/api/complaints.api'
import { usersApi } from '@/api/users.api'
import ComplaintTable from '@/components/complaints/ComplaintTable'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Pagination from '@/components/common/Pagination'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { PaginatedData } from '@/types/api.types'
import type { EngineerUser } from '@/types/auth.types'
import type {
  ComplaintListItem,
  ComplaintPeriod,
  ComplaintStatus,
} from '@/types/complaint.types'

interface ComplaintMetricDialogProps {
  open: boolean
  title: string
  description?: string
  statuses?: ComplaintStatus[]
  zoneId?: number
  period?: ComplaintPeriod | null
  onOpenChange: (open: boolean) => void
}

export const ComplaintMetricDialog = ({
  open,
  title,
  description,
  statuses,
  zoneId,
  period,
  onOpenChange,
}: ComplaintMetricDialogProps) => {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PaginatedData<ComplaintListItem> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const statusKey = statuses?.join(',') ?? ''

  useEffect(() => {
    if (!open) return
    setPage(1)
  }, [open, statusKey, zoneId])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await complaintsApi.list({
          status: statuses,
          zone: zoneId,
          period: period ?? undefined,
          ordering: 'created_at',
          page,
          page_size: 10,
        })
        if (!cancelled) setData(response.data)
      } catch {
        if (!cancelled) setError(t('dashboard.popupLoadFailed'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [open, page, statusKey, zoneId, period, t])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ?? t('dashboard.popupDescription')}
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <ComplaintTable
              complaints={data?.results ?? []}
              compact
              showActions={false}
              openLinksInNewTab
            />
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
      </DialogContent>
    </Dialog>
  )
}

interface EngineerRosterDialogProps {
  open: boolean
  zoneId?: number
  zoneName?: string
  onOpenChange: (open: boolean) => void
}

export const EngineerRosterDialog = ({
  open,
  zoneId,
  zoneName,
  onOpenChange,
}: EngineerRosterDialogProps) => {
  const { t } = useTranslation()
  const [engineers, setEngineers] = useState<EngineerUser[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    usersApi
      .engineers({ zone_id: zoneId })
      .then((response) => setEngineers(response.data ?? []))
      .catch(() => setEngineers([]))
      .finally(() => setLoading(false))
  }, [open, zoneId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t('dashboard.zoneEngineersTitle', { zone: zoneName ?? '' })}
          </DialogTitle>
          <DialogDescription>{t('dashboard.zoneEngineersDescription')}</DialogDescription>
        </DialogHeader>
        {loading ? (
          <LoadingSpinner />
        ) : engineers.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('dashboard.noEngineers')}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('users.name')}</TableHead>
                  <TableHead>{t('users.email')}</TableHead>
                  <TableHead>{t('users.zones')}</TableHead>
                  <TableHead className="text-right">
                    {t('dashboard.activeColumn')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {engineers.map((engineer) => (
                  <TableRow key={engineer.id}>
                    <TableCell className="font-medium">{engineer.full_name}</TableCell>
                    <TableCell>{engineer.email}</TableCell>
                    <TableCell>
                      {engineer.current_zones.map((zone) => zone.name).join(', ') || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {engineer.active_complaint_count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

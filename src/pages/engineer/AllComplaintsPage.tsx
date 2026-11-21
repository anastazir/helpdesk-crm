import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { complaintsApi } from '@/api/complaints.api'
import { zonesApi } from '@/api/zones.api'
import EmptyState from '@/components/common/EmptyState'
import ErrorBanner from '@/components/common/ErrorBanner'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import PageHeader from '@/components/common/PageHeader'
import Pagination from '@/components/common/Pagination'
import StatusBadge from '@/components/complaints/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { PaginatedData } from '@/types/api.types'
import type {
  ComplaintLimited,
  ComplaintStatus,
} from '@/types/complaint.types'
import type { Zone } from '@/types/zone.types'
import { STATUS_ORDER } from '@/utils/constants'
import { getErrorMessage } from '@/utils/errors'
import { formatDate } from '@/utils/formatters'
import { logger } from '@/utils/logger'

const filterSchema = z.object({
  zone: z.string(),
  status: z.string(),
  search: z.string(),
})

type FilterFormValues = z.infer<typeof filterSchema>

const AllComplaintsPage = () => {
  const { t } = useTranslation()
  const [zones, setZones] = useState<Zone[]>([])
  const [myIds, setMyIds] = useState<Set<number>>(new Set())
  const [data, setData] = useState<PaginatedData<ComplaintLimited> | null>(null)
  const [filters, setFilters] = useState<FilterFormValues>({
    zone: '',
    status: '',
    search: '',
  })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: { zone: '', status: '', search: '' },
  })

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [zonesResponse, mineResponse] = await Promise.all([
          zonesApi.list(),
          complaintsApi.myComplaints({ page_size: 100 }),
        ])
        setZones(zonesResponse.data ?? [])
        const ids = new Set(
          (mineResponse.data?.results ?? []).map((complaint) => complaint.id),
        )
        setMyIds(ids)
      } catch (optionsError) {
        logger.error('[ENGINEER] Failed to load filter options.', optionsError)
      }
    }
    void loadOptions()
  }, [])

  const loadComplaints = async () => {
    setLoading(true)
    setError(null)
    logger.info('[ENGINEER] Loading all complaints summary.', { page })
    try {
      const response = await complaintsApi.listLimited({
        zone: filters.zone ? Number(filters.zone) : undefined,
        status: filters.status
          ? (filters.status as ComplaintStatus)
          : undefined,
        search: filters.search.trim() || undefined,
        page,
        page_size: 20,
      })
      setData(response.data)
    } catch (loadError) {
      logger.error('[ENGINEER] Failed to load all complaints.', loadError)
      setError(getErrorMessage(loadError, t('engineer.allLoadFailed')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadComplaints()
  }, [filters, page])

  const applyFilters = (values: FilterFormValues) => {
    setFilters(values)
    setPage(1)
  }

  const resetFilters = () => {
    reset({ zone: '', status: '', search: '' })
    setFilters({ zone: '', status: '', search: '' })
    setPage(1)
  }

  const statusOptions = useMemo(() => STATUS_ORDER, [])

  return (
    <div>
      <PageHeader
        title={t('engineer.allComplaints')}
        description={t('engineer.allComplaintsSubtitle')}
      />

      <div className="mb-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{t('engineer.summaryBanner')}</span>
      </div>

      <form
        onSubmit={handleSubmit(applyFilters)}
        className="mb-4 rounded-lg border border-border bg-white p-4 dark:bg-slate-900"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label>{t('complaint.zone')}</Label>
            <Controller
              control={control}
              name="zone"
              render={({ field }) => (
                <Select
                  value={field.value || 'all'}
                  onValueChange={(value) =>
                    field.onChange(value === 'all' ? '' : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.allZones')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.allZones')}</SelectItem>
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={String(zone.id)}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t('complaint.status')}</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  value={field.value || 'all'}
                  onValueChange={(value) =>
                    field.onChange(value === 'all' ? '' : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.allStatuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.allStatuses')}</SelectItem>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`status.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="all-search">{t('common.search')}</Label>
            <Input
              id="all-search"
              placeholder={t('filters.searchComplaints')}
              {...register('search')}
            />
          </div>

          <div className="flex items-end gap-2">
            <Button type="submit">{t('common.apply')}</Button>
            <Button type="button" variant="outline" onClick={resetFilters}>
              {t('common.reset')}
            </Button>
          </div>
        </div>
      </form>

      {error && <ErrorBanner message={error} onRetry={() => void loadComplaints()} />}

      {loading ? (
        <LoadingSpinner />
      ) : (data?.results.length ?? 0) === 0 ? (
        <EmptyState title={t('complaint.noComplaints')} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border bg-white dark:bg-slate-900">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('complaint.complaintId')}</TableHead>
                  <TableHead>{t('complaint.zone')}</TableHead>
                  <TableHead>{t('complaint.address')}</TableHead>
                  <TableHead>{t('complaint.status')}</TableHead>
                  <TableHead>{t('complaint.createdAt')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.results ?? []).map((complaint) => {
                  const assignedToMe = myIds.has(complaint.id)
                  return (
                    <TableRow
                      key={complaint.id}
                      className={cn(
                        assignedToMe && 'bg-blue-50 dark:bg-blue-950/30',
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">#{complaint.id}</span>
                          {assignedToMe && (
                            <Badge className="rounded bg-blue-100 text-[10px] text-blue-700">
                              {t('engineer.assignedToYou')}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {complaint.zone ?? t('complaint.notRecorded')}
                      </TableCell>
                      <TableCell className="max-w-64 truncate">
                        {complaint.address ?? t('complaint.notRecorded')}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={complaint.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(complaint.created_at)}
                      </TableCell>
                    </TableRow>
                  )
                })}
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
    </div>
  )
}

export default AllComplaintsPage

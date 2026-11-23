import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'

import { complaintsApi } from '@/api/complaints.api'
import { usersApi } from '@/api/users.api'
import { zonesApi } from '@/api/zones.api'
import AssignEngineerModal from '@/components/complaints/AssignEngineerModal'
import ComplaintFilters, {
  type ComplaintFilterValues,
} from '@/components/complaints/ComplaintFilters'
import ComplaintKpiCards from '@/components/complaints/ComplaintKpiCards'
import ComplaintTable from '@/components/complaints/ComplaintTable'
import StatusTabBar from '@/components/complaints/StatusTabBar'
import ErrorBanner from '@/components/common/ErrorBanner'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import PageHeader from '@/components/common/PageHeader'
import Pagination from '@/components/common/Pagination'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PaginatedData } from '@/types/api.types'
import type { EngineerUser } from '@/types/auth.types'
import type {
  ComplaintKpis,
  ComplaintListItem,
  ComplaintOrdering,
  ComplaintPeriod,
  ComplaintStatus,
} from '@/types/complaint.types'
import { usePermissions } from '@/hooks/usePermissions'
import type { Zone } from '@/types/zone.types'
import { STATUS_ORDER } from '@/utils/constants'
import { getErrorMessage } from '@/utils/errors'
import { logger } from '@/utils/logger'

const EMPTY_FILTERS: ComplaintFilterValues = {
  search: '',
  zone_ids: [],
  assigned_engineer_ids: [],
  dateFrom: '',
  dateTo: '',
}

const parsePage = (params: URLSearchParams): number =>
  Math.max(1, Number(params.get('page') ?? '1') || 1)

const parseOrdering = (params: URLSearchParams): ComplaintOrdering =>
  params.get('ordering') === 'updated_at' ? 'updated_at' : 'created_at'

const parseStatuses = (params: URLSearchParams): ComplaintStatus[] =>
  params.getAll('status') as ComplaintStatus[]

const parsePeriod = (params: URLSearchParams): ComplaintPeriod | null => {
  const value = params.get('period')
  return value === 'total' || value === 'today' || value === 'week' || value === 'month' || value === 'last_month'
    ? value
    : null
}

const parseFilters = (params: URLSearchParams): ComplaintFilterValues => ({
  search: params.get('search') ?? '',
  zone_ids: params.getAll('zone'),
  assigned_engineer_ids: params.getAll('assigned_engineer'),
  dateFrom: params.get('date_from') ?? '',
  dateTo: params.get('date_to') ?? '',
})

const ComplaintsListPage = () => {
  const { t } = useTranslation()
  const { canAssign, canCreate } = usePermissions()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<ComplaintFilterValues>(() =>
    parseFilters(searchParams),
  )
  const [statuses, setStatuses] = useState<ComplaintStatus[]>(() =>
    parseStatuses(searchParams),
  )
  const [ordering, setOrdering] = useState<ComplaintOrdering>(() =>
    parseOrdering(searchParams),
  )
  const [page, setPage] = useState<number>(() => parsePage(searchParams))
  const [period, setPeriod] = useState<ComplaintPeriod | null>(() => parsePeriod(searchParams))
  const [kpis, setKpis] = useState<ComplaintKpis | null>(null)
  const [kpisLoading, setKpisLoading] = useState(true)
  const [zones, setZones] = useState<Zone[]>([])
  const [engineers, setEngineers] = useState<EngineerUser[]>([])
  const [data, setData] = useState<PaginatedData<ComplaintListItem> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignTarget, setAssignTarget] = useState<ComplaintListItem | null>(null)

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [zonesResponse, engineersResponse] = await Promise.all([
          zonesApi.list(),
          usersApi.engineers(),
        ])
        setZones(zonesResponse.data ?? [])
        setEngineers(engineersResponse.data ?? [])
      } catch (optionsError) {
        logger.error('[COMPLAINTS] Failed to load filter options.', optionsError)
      }
    }

    void loadOptions()
  }, [])

  const updateUrl = (
    nextFilters: ComplaintFilterValues,
    nextStatuses: ComplaintStatus[],
    nextOrdering: ComplaintOrdering,
    nextPage: number,
    nextPeriod: ComplaintPeriod | null = period,
  ) => {
    const params = new URLSearchParams()
    nextStatuses.forEach((status) => params.append('status', status))
    nextFilters.zone_ids.forEach((zone) => params.append('zone', zone))
    nextFilters.assigned_engineer_ids.forEach((engineer) =>
      params.append('assigned_engineer', engineer),
    )
    if (nextFilters.search.trim()) params.set('search', nextFilters.search.trim())
    if (nextFilters.dateFrom) params.set('date_from', nextFilters.dateFrom)
    if (nextFilters.dateTo) params.set('date_to', nextFilters.dateTo)
    if (nextOrdering !== 'created_at') params.set('ordering', nextOrdering)
    if (nextPage > 1) params.set('page', String(nextPage))
    if (nextPeriod) params.set('period', nextPeriod)
    setSearchParams(params, { replace: true })
  }

  useEffect(() => {
    const loadKpis = async () => {
      setKpisLoading(true)
      try {
        const response = await complaintsApi.kpis()
        setKpis(response.data)
      } catch (kpiError) {
        logger.error('[COMPLAINTS] Failed to load KPI counts.', kpiError)
      } finally {
        setKpisLoading(false)
      }
    }
    void loadKpis()
  }, [])

  const loadComplaints = async () => {
    setLoading(true)
    setError(null)
    logger.info('[COMPLAINTS] Loading complaint list.', { page, ordering })

    try {
      const zoneIds = filters.zone_ids.map(Number)
      const engineerIds = filters.assigned_engineer_ids.map(Number)

      const response = await complaintsApi.list({
        search: filters.search.trim() || undefined,
        status: statuses.length > 0 ? statuses : undefined,
        zone: zoneIds.length > 0 ? zoneIds : undefined,
        assigned_engineer: engineerIds.length > 0 ? engineerIds : undefined,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        period: period ?? undefined,
        ordering,
        page,
        page_size: 20,
      })
      setData(response.data)
    } catch (loadError) {
      logger.error('[COMPLAINTS] Failed to load complaints.', loadError)
      setError(getErrorMessage(loadError, t('complaint.loadFailed')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadComplaints()
  }, [filters, statuses, ordering, page, period])

  const applyFilters = (values: ComplaintFilterValues) => {
    setFilters(values)
    setPage(1)
    updateUrl(values, statuses, ordering, 1)
  }

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS)
    setPage(1)
    updateUrl(EMPTY_FILTERS, statuses, ordering, 1)
  }

  const changeStatuses = (nextStatuses: ComplaintStatus[]) => {
    setStatuses(nextStatuses)
    setPage(1)
    updateUrl(filters, nextStatuses, ordering, 1)
  }

  const changeOrdering = (nextOrdering: ComplaintOrdering) => {
    setOrdering(nextOrdering)
    setPage(1)
    updateUrl(filters, statuses, nextOrdering, 1)
  }

  const changePage = (nextPage: number) => {
    setPage(nextPage)
    updateUrl(filters, statuses, ordering, nextPage, period)
  }

  const selectPeriod = (nextPeriod: ComplaintPeriod) => {
    const selected = period === nextPeriod ? null : nextPeriod
    setPeriod(selected)
    setFilters(EMPTY_FILTERS)
    setStatuses([])
    setPage(1)
    updateUrl(EMPTY_FILTERS, [], ordering, 1, selected)
  }

  return (
    <div>
      <PageHeader
        title={t('complaint.title')}
        description={t('complaint.subtitle')}
        actions={
          canCreate ? (
            <Button asChild>
              <Link to="/complaints/new">
                <Plus className="h-4 w-4" />
                {t('complaint.newComplaint')}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <ComplaintKpiCards
        kpis={kpis}
        selected={period}
        loading={kpisLoading}
        onSelect={selectPeriod}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <StatusTabBar
            statuses={STATUS_ORDER}
            value={statuses}
            onChange={changeStatuses}
            disabled={period !== null}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('common.sortBy')}</span>
          <Select
            value={ordering}
            onValueChange={(value) =>
              changeOrdering(value as ComplaintOrdering)
            }
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">{t('common.newestFirst')}</SelectItem>
              <SelectItem value="updated_at">
                {t('common.latestStatusFirst')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ComplaintFilters
        values={filters}
        zones={zones}
        engineers={engineers}
        onChange={applyFilters}
        onReset={resetFilters}
        disabled={period !== null}
      />

      {error && <ErrorBanner message={error} onRetry={() => void loadComplaints()} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <ComplaintTable
            complaints={data?.results ?? []}
            onAssign={canAssign ? (complaint) => setAssignTarget(complaint) : undefined}
          />
          {data && (
            <Pagination
              page={data.page}
              totalPages={data.total_pages}
              count={data.count}
              pageSize={data.page_size}
              onPageChange={changePage}
            />
          )}
        </>
      )}

      <AssignEngineerModal
        open={assignTarget !== null}
        onOpenChange={(open) => {
          if (!open) setAssignTarget(null)
        }}
        complaintId={assignTarget?.id ?? 0}
        zoneId={assignTarget?.zone?.id ?? null}
        currentEngineerId={null}
        onAssigned={() => void loadComplaints()}
      />
    </div>
  )
}

export default ComplaintsListPage

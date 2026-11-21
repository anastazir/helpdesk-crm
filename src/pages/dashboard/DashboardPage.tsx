import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, Inbox, Layers } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { complaintsApi } from '@/api/complaints.api'
import { zonesApi } from '@/api/zones.api'
import ComplaintTable from '@/components/complaints/ComplaintTable'
import SLATimer from '@/components/complaints/SLATimer'
import ErrorBanner from '@/components/common/ErrorBanner'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import type { ComplaintListItem } from '@/types/complaint.types'
import type { Zone } from '@/types/zone.types'
import { SLA_OVERDUE_SECONDS } from '@/utils/constants'
import { getErrorMessage } from '@/utils/errors'
import { formatDateOnly } from '@/utils/formatters'
import { logger } from '@/utils/logger'

interface TeamActivityEntry {
  id: number
  name: string
  count: number
}

const DashboardPage = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [recent, setRecent] = useState<ComplaintListItem[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [slaComplaints, setSlaComplaints] = useState<ComplaintListItem[]>([])
  const [teamActivity, setTeamActivity] = useState<TeamActivityEntry[]>([])
  const [totals, setTotals] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    closedToday: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)
    logger.info('[DASHBOARD] Loading dashboard data.')

    try {
      const today = formatDateOnly(new Date().toISOString())
      const todayForApi = new Date().toISOString().slice(0, 10)

      const [
        recentResponse,
        totalResponse,
        openResponse,
        progressResponse,
        zonesResponse,
        slaResponse,
      ] = await Promise.all([
        complaintsApi.list({ page_size: 5, ordering: 'created_at' }),
        complaintsApi.list({ page_size: 1 }),
        complaintsApi.list({ status: 'open', page_size: 1 }),
        complaintsApi.list({ status: 'in_progress', page_size: 1 }),
        zonesApi.list(),
        complaintsApi.list({ page_size: 100, ordering: 'created_at' }),
      ])

      setRecent(recentResponse.data?.results ?? [])
      setZones(zonesResponse.data ?? [])
      setTotals({
        total: totalResponse.data?.count ?? 0,
        open: openResponse.data?.count ?? 0,
        inProgress: progressResponse.data?.count ?? 0,
        closedToday: 0,
      })

      const allRecent = slaResponse.data?.results ?? []
      setSlaComplaints(
        allRecent
          .filter(
            (complaint) =>
              complaint.status !== 'closed' &&
              complaint.time_open_seconds > SLA_OVERDUE_SECONDS,
          )
          .slice(0, 5),
      )

      const closedResponse = await complaintsApi.list({
        status: 'closed',
        page_size: 100,
        ordering: 'created_at',
      })
      const closedItems = closedResponse.data?.results ?? []
      const closedHistoryResults = await Promise.allSettled(
        closedItems.map((complaint) => complaintsApi.getHistory(complaint.id)),
      )
      let closedToday = 0
      closedHistoryResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const closedEntry = (result.value.data ?? [])
            .filter((entry) => entry.new_status === 'closed')
            .sort((a, b) => {
              const timeDifference =
                new Date(b.changed_at).getTime() -
                new Date(a.changed_at).getTime()
              return timeDifference !== 0 ? timeDifference : b.id - a.id
            })[0]
          if (closedEntry && formatDateOnly(closedEntry.changed_at) === today) {
            closedToday += 1
          }
        } else {
          logger.error(
            '[DASHBOARD] Failed to load status history for closed complaint.',
            result.reason,
          )
        }
      })
      setTotals((current) => ({ ...current, closedToday }))

      if (user?.role === 'admin') {
        const todayResponse = await complaintsApi.list({
          date_from: todayForApi,
          date_to: todayForApi,
          page_size: 100,
          ordering: 'created_at',
        })
        const todayItems = todayResponse.data?.results ?? []
        const detailResults = await Promise.allSettled(
          todayItems.map((complaint) => complaintsApi.getById(complaint.id)),
        )

        const counts = new Map<number, TeamActivityEntry>()
        detailResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            const creator = result.value.data?.created_by
            if (creator && creator.role === 'helpdesk') {
              const current = counts.get(creator.id) ?? {
                id: creator.id,
                name: creator.full_name,
                count: 0,
              }
              current.count += 1
              counts.set(creator.id, current)
            }
          } else {
            logger.error('[DASHBOARD] Failed to load a complaint detail.', result.reason)
          }
        })
        setTeamActivity(
          [...counts.values()].sort((a, b) => b.count - a.count),
        )
      }
    } catch (loadError) {
      logger.error('[DASHBOARD] Failed to load dashboard.', loadError)
      setError(getErrorMessage(loadError, t('dashboard.loadFailed')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [user?.role])

  const sortedZones = [...zones].sort(
    (a, b) => (b.complaint_count ?? 0) - (a.complaint_count ?? 0),
  )
  const maxZoneCount = Math.max(
    1,
    ...sortedZones.map((zone) => zone.complaint_count ?? 0),
  )

  if (loading && recent.length === 0 && zones.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <PageHeader title={t('dashboard.title')} description={t('dashboard.subtitle')} />

      {error && <ErrorBanner message={error} onRetry={() => void loadDashboard()} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t('dashboard.totalComplaints')}
          value={totals.total}
          icon={Layers}
        />
        <StatCard
          title={t('dashboard.openComplaints')}
          value={totals.open}
          icon={Inbox}
          valueClassName="text-blue-600"
        />
        <StatCard
          title={t('dashboard.inProgress')}
          value={totals.inProgress}
          icon={Clock}
          valueClassName="text-amber-600"
        />
        <StatCard
          title={t('dashboard.closedToday')}
          value={totals.closedToday}
          icon={CheckCircle2}
          valueClassName="text-green-600"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>{t('dashboard.complaintsByZone')}</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedZones.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('dashboard.noZoneData')}</p>
            ) : (
              <div className="space-y-3">
                {sortedZones.map((zone) => {
                  const count = zone.complaint_count ?? 0
                  return (
                    <div key={zone.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-medium">{zone.name}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded bg-primary"
                          style={{ width: `${(count / maxZoneCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>{t('dashboard.slaAlerts')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.slaAlertsSubtitle')}
            </p>
          </CardHeader>
          <CardContent>
            {slaComplaints.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('dashboard.noSlaAlerts')}</p>
            ) : (
              <div className="divide-y divide-border">
                {slaComplaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <Link
                        to={`/complaints/${complaint.id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        #{complaint.id}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {complaint.zone?.name ?? t('complaint.notRecorded')}
                      </p>
                    </div>
                    <SLATimer seconds={complaint.time_open_seconds} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('dashboard.recentComplaints')}</h2>
          <Link to="/complaints" className="text-sm font-medium text-primary hover:underline">
            {t('dashboard.viewAll')}
          </Link>
        </div>
        <ComplaintTable complaints={recent} compact showActions={false} />
      </div>

      {user?.role === 'admin' && (
        <Card className="mt-6 border-border shadow-sm">
          <CardHeader>
            <CardTitle>{t('dashboard.teamActivity')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.teamActivitySubtitle')}
            </p>
          </CardHeader>
          <CardContent>
            {teamActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('dashboard.noTeamActivity')}
              </p>
            ) : (
              <div className="divide-y divide-border">
                {teamActivity.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <span className="text-sm font-medium">{entry.name}</span>
                    <span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                      {t('dashboard.createdCount', { count: entry.count })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DashboardPage

import { useEffect, useState } from 'react'
import { format, subDays } from 'date-fns'
import {
  Archive,
  CheckCircle2,
  Clock,
  Inbox,
  Layers,
  Package,
  RefreshCw,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { complaintsApi } from '@/api/complaints.api'
import { usersApi } from '@/api/users.api'
import { zonesApi } from '@/api/zones.api'
import { useAppSelector } from '@/store/hooks'
import AiAnalyticsCard from '@/components/dashboard/AiAnalyticsCard'
import AgingBuckets from '@/components/dashboard/AgingBuckets'
import EngineerWorkload from '@/components/dashboard/EngineerWorkload'
import IssueHotspots from '@/components/dashboard/IssueHotspots'
import StatusDonut from '@/components/dashboard/StatusDonut'
import TrendChart, { type TrendPoint } from '@/components/dashboard/TrendChart'
import ZonePerformance from '@/components/dashboard/ZonePerformance'
import ComplaintTable from '@/components/complaints/ComplaintTable'
import SLATimer from '@/components/complaints/SLATimer'
import StatusBadge from '@/components/complaints/StatusBadge'
import ErrorBanner from '@/components/common/ErrorBanner'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import UserAvatar from '@/components/common/UserAvatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import type { EngineerUser } from '@/types/auth.types'
import type {
  ComplaintListItem,
  ComplaintStatus,
} from '@/types/complaint.types'
import type { Zone } from '@/types/zone.types'
import { SLA_OVERDUE_SECONDS, STATUS_ORDER } from '@/utils/constants'
import { getErrorMessage } from '@/utils/errors'
import { formatDuration } from '@/utils/formatters'
import { logger } from '@/utils/logger'

interface TeamActivityEntry {
  id: number
  name: string
  count: number
}

const DashboardPage = () => {
  const aiEnabled = useAppSelector((state) => state.assistant.aiEnabled)
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [complaints, setComplaints] = useState<ComplaintListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [zones, setZones] = useState<Zone[]>([])
  const [engineers, setEngineers] = useState<EngineerUser[]>([])
  const [closedToday, setClosedToday] = useState(0)
  const [teamActivity, setTeamActivity] = useState<TeamActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)
    logger.info('[DASHBOARD] Loading dashboard analytics.')

    try {
      const [complaintsResponse, zonesResponse, engineersResponse] =
        await Promise.all([
          complaintsApi.list({ page_size: 100, ordering: 'created_at' }),
          zonesApi.list(),
          usersApi.engineers(),
        ])

      const items = complaintsResponse.data?.results ?? []
      setComplaints(items)
      setTotalCount(complaintsResponse.data?.count ?? items.length)
      setZones(zonesResponse.data ?? [])
      setEngineers(engineersResponse.data ?? [])

      const todayKey = format(new Date(), 'yyyy-MM-dd')

      const closedItems = items.filter(
        (complaint) => complaint.status === 'closed',
      )
      const closedHistoryResults = await Promise.allSettled(
        closedItems.map((complaint) => complaintsApi.getHistory(complaint.id)),
      )
      let closedTodayCount = 0
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
          if (
            closedEntry &&
            format(new Date(closedEntry.changed_at), 'yyyy-MM-dd') === todayKey
          ) {
            closedTodayCount += 1
          }
        } else {
          logger.error(
            '[DASHBOARD] Failed to load history for a closed complaint.',
            result.reason,
          )
        }
      })
      setClosedToday(closedTodayCount)

      if (user?.role === 'admin') {
        const activity = new Map<number, TeamActivityEntry>()
        items.forEach((complaint) => {
          if (
            complaint.created_by?.role !== 'helpdesk' ||
            format(new Date(complaint.created_at), 'yyyy-MM-dd') !== todayKey
          ) {
            return
          }
          const current = activity.get(complaint.created_by.id) ?? {
            id: complaint.created_by.id,
            name: complaint.created_by.full_name,
            count: 0,
          }
          current.count += 1
          activity.set(complaint.created_by.id, current)
        })
        setTeamActivity([...activity.values()].sort((a, b) => b.count - a.count))
      } else {
        setTeamActivity([])
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

  const statusCounts = STATUS_ORDER.reduce(
    (counts, status) => {
      counts[status] = complaints.filter(
        (complaint) => complaint.status === status,
      ).length
      return counts
    },
    {} as Record<ComplaintStatus, number>,
  )

  const unresolved = complaints.filter(
    (complaint) => complaint.status !== 'closed',
  )
  const averageOpenAge =
    unresolved.length > 0
      ? Math.round(
          unresolved.reduce(
            (sum, complaint) => sum + complaint.time_open_seconds,
            0,
          ) / unresolved.length,
        )
      : 0
  const completionRate =
    totalCount > 0
      ? Math.round(
          ((statusCounts.resolved + statusCounts.closed) / totalCount) * 100,
        )
      : 0
  const unassignedCount = complaints.filter(
    (complaint) => !complaint.assigned_engineer,
  ).length
  const awaitingParts =
    statusCounts.parts_requested + statusCounts.parts_provided
  const slaAlerts = complaints
    .filter(
      (complaint) =>
        complaint.status !== 'closed' &&
        complaint.time_open_seconds > SLA_OVERDUE_SECONDS,
    )
    .sort((a, b) => b.time_open_seconds - a.time_open_seconds)
    .slice(0, 5)

  const trendData: TrendPoint[] = Array.from({ length: 7 }, (_, index) => {
    const day = subDays(new Date(), 6 - index)
    const key = format(day, 'yyyy-MM-dd')
    return {
      label: new Intl.DateTimeFormat(i18n.language, {
        weekday: 'short',
      }).format(day),
      count: complaints.filter(
        (complaint) =>
          format(new Date(complaint.created_at), 'yyyy-MM-dd') === key,
      ).length,
    }
  })

  const recentComplaints = complaints.slice(0, 5)

  if (loading && complaints.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.subtitle')}
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadDashboard()}
            disabled={loading}
          >
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            {t('common.refresh')}
          </Button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={() => void loadDashboard()} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title={t('dashboard.totalComplaints')}
          value={totalCount}
          hint={t('dashboard.completionRateHint', { rate: completionRate })}
          icon={Layers}
        />
        <StatCard
          title={t('dashboard.openComplaints')}
          value={statusCounts.open}
          hint={t('dashboard.unassignedHint', { count: unassignedCount })}
          icon={Inbox}
          valueClassName="text-blue-600"
          iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-950/40"
        />
        <StatCard
          title={t('dashboard.inProgress')}
          value={statusCounts.in_progress}
          hint={t('dashboard.avgOpenAgeHint', {
            duration: formatDuration(averageOpenAge),
          })}
          icon={Clock}
          valueClassName="text-amber-600"
          iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-950/40"
        />
        <StatCard
          title={t('dashboard.awaitingParts')}
          value={awaitingParts}
          icon={Package}
          valueClassName="text-violet-600"
          iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-950/40"
        />
        <StatCard
          title={t('dashboard.resolved')}
          value={statusCounts.resolved}
          icon={CheckCircle2}
          valueClassName="text-green-600"
          iconClassName="bg-green-50 text-green-600 dark:bg-green-950/40"
        />
        <StatCard
          title={t('dashboard.closed')}
          value={statusCounts.closed}
          hint={t('dashboard.closedTodayHint', { count: closedToday })}
          icon={Archive}
          valueClassName="text-slate-700"
          iconClassName="bg-slate-100 text-slate-600 dark:bg-slate-800"
        />
      </div>

      {aiEnabled && user?.role === 'admin' && <AiAnalyticsCard />}

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>{t('dashboard.statusDistribution')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.statusDistributionSubtitle')}
            </p>
          </CardHeader>
          <CardContent>
            <StatusDonut counts={statusCounts} />
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard.intakeTrend')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.intakeTrendSubtitle')}
            </p>
          </CardHeader>
          <CardContent>
            <TrendChart data={trendData} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>{t('dashboard.aging')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.agingSubtitle')}
            </p>
          </CardHeader>
          <CardContent>
            <AgingBuckets complaints={complaints} />
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>{t('dashboard.engineerWorkload')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.engineerWorkloadSubtitle')}
            </p>
          </CardHeader>
          <CardContent>
            <EngineerWorkload engineers={engineers} />
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>{t('dashboard.issueHotspots')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.issueHotspotsSubtitle')}
            </p>
          </CardHeader>
          <CardContent>
            <IssueHotspots complaints={complaints} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>{t('dashboard.slaAlerts')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.slaAlertsSubtitle')}
            </p>
          </CardHeader>
          <CardContent>
            {slaAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('dashboard.noSlaAlerts')}
              </p>
            ) : (
              <div className="divide-y divide-border">
                {slaAlerts.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/complaints/${complaint.id}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          #{complaint.id}
                        </Link>
                        <StatusBadge status={complaint.status} />
                      </div>
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

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>{t('dashboard.zonePerformance')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.zonePerformanceSubtitle')}
            </p>
          </CardHeader>
          <CardContent>
            <ZonePerformance zones={zones} complaints={complaints} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {t('dashboard.recentComplaints')}
          </h2>
          <Link
            to="/complaints"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t('dashboard.viewAll')}
          </Link>
        </div>
        <ComplaintTable
          complaints={recentComplaints}
          compact
          showActions={false}
        />
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
                    <div className="flex items-center gap-3">
                      <UserAvatar id={entry.id} fullName={entry.name} />
                      <span className="text-sm font-medium">{entry.name}</span>
                    </div>
                    <span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
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

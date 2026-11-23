import { useEffect, useState } from 'react'
import { ClipboardCheck, Clock, Inbox } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { complaintsApi } from '@/api/complaints.api'
import EmptyState from '@/components/common/EmptyState'
import ErrorBanner from '@/components/common/ErrorBanner'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import AiDayPlanCard from '@/components/engineer/AiDayPlanCard'
import { useAppSelector } from '@/store/hooks'
import SLATimer from '@/components/complaints/SLATimer'
import StatusBadge from '@/components/complaints/StatusBadge'
import StatusTabBar from '@/components/complaints/StatusTabBar'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Complaint, ComplaintStatus } from '@/types/complaint.types'
import { ENGINEER_STATUSES } from '@/utils/constants'
import { getErrorMessage } from '@/utils/errors'
import { formatDuration } from '@/utils/formatters'
import { logger } from '@/utils/logger'

const ACTIVE_STATUSES: ComplaintStatus[] = [
  'assigned',
  'in_progress',
  'parts_requested',
  'parts_provided',
]

const MyComplaintsPage = () => {
  const { t } = useTranslation()
  const aiEnabled = useAppSelector((state) => state.assistant.aiEnabled)
  const isAdmin = useAppSelector((state) => state.auth.user?.role === 'admin')
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [statuses, setStatuses] = useState<ComplaintStatus[]>(
    () => searchParams.getAll('status') as ComplaintStatus[],
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<number | null>(null)

  const loadComplaints = async () => {
    setLoading(true)
    setError(null)
    logger.info('[ENGINEER] Loading my complaints.')
    try {
      const response = await complaintsApi.myComplaints({
        page_size: 100,
        ordering: 'created_at',
      })
      setComplaints(response.data?.results ?? [])
    } catch (loadError) {
      logger.error('[ENGINEER] Failed to load my complaints.', loadError)
      setError(getErrorMessage(loadError, t('engineer.loadFailed')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadComplaints()
  }, [])

  const now = new Date()
  const completedThisMonth = complaints.filter((complaint) => {
    if (complaint.status !== 'closed') return false
    const created = new Date(complaint.created_at)
    return (
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear()
    )
  }).length

  const filtered =
    statuses.length === 0
      ? complaints
      : complaints.filter((complaint) => statuses.includes(complaint.status))

  const changeStatuses = (nextStatuses: ComplaintStatus[]) => {
    setStatuses(nextStatuses)
    const params = new URLSearchParams()
    nextStatuses.forEach((nextStatus) => params.append('status', nextStatus))
    setSearchParams(params, { replace: true })
  }

  const markInProgress = async (complaint: Complaint) => {
    setActionId(complaint.id)
    try {
      await complaintsApi.updateStatus(complaint.id, { status: 'in_progress' })
      logger.info('[ENGINEER] Complaint marked in progress.', {
        complaintId: complaint.id,
      })
      toast.success(t('complaint.statusUpdated'))
      await loadComplaints()
    } catch (actionError) {
      logger.error('[ENGINEER] Failed to update status.', actionError)
      toast.error(getErrorMessage(actionError, t('errors.actionFailed')))
    } finally {
      setActionId(null)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title={t('engineer.myComplaints')}
        description={t('engineer.myComplaintsSubtitle')}
      />

      {error && <ErrorBanner message={error} onRetry={() => void loadComplaints()} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title={t('engineer.active')}
          value={complaints.filter((item) => ACTIVE_STATUSES.includes(item.status)).length}
          hint={t('engineer.statActiveHint')}
          icon={Clock}
        />
        <StatCard
          title={t('engineer.awaitingVerification')}
          value={complaints.filter((item) => item.status === 'resolved').length}
          hint={t('engineer.statVerificationHint')}
          icon={Inbox}
          valueClassName="text-amber-600"
        />
        <StatCard
          title={t('engineer.completedThisMonth')}
          value={completedThisMonth}
          hint={t('engineer.statCompletedHint')}
          icon={ClipboardCheck}
          valueClassName="text-green-600"
        />
      </div>

      <div className="mt-6">
        <StatusTabBar
          statuses={ENGINEER_STATUSES}
          value={statuses}
          onChange={changeStatuses}
        />
      </div>

      {isAdmin && aiEnabled && <AiDayPlanCard />}

      {filtered.length === 0 ? (
        <EmptyState title={t('engineer.noComplaints')} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-white dark:bg-slate-900">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('complaint.complaintId')}</TableHead>
                <TableHead>{t('complaint.callerName')}</TableHead>
                <TableHead>{t('complaint.zone')}</TableHead>
                <TableHead>{t('complaint.address')}</TableHead>
                <TableHead>{t('complaint.issues')}</TableHead>
                <TableHead>{t('complaint.status')}</TableHead>
                <TableHead>{t('complaint.timeOpen')}</TableHead>
                <TableHead>{t('complaint.timeInStatus')}</TableHead>
                <TableHead>{t('engineer.action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((complaint) => (
                <TableRow
                  key={complaint.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/engineer/complaints/${complaint.id}`)}
                >
                  <TableCell>
                    <Link
                      to={`/engineer/complaints/${complaint.id}`}
                      className="font-semibold text-primary hover:underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      #{complaint.id}
                    </Link>
                  </TableCell>
                  <TableCell>{complaint.caller_name ?? t('complaint.notRecorded')}</TableCell>
                  <TableCell>{complaint.zone?.name ?? t('complaint.notRecorded')}</TableCell>
                  <TableCell className="max-w-48 truncate">
                    {complaint.address ?? t('complaint.notRecorded')}
                  </TableCell>
                  <TableCell className="max-w-48">
                    <span className="line-clamp-2">
                      {complaint.issues.map((issue) => issue.name).join(', ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={complaint.status} />
                  </TableCell>
                  <TableCell>
                    <SLATimer seconds={complaint.time_open_seconds} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDuration(complaint.time_in_status_seconds)}
                  </TableCell>
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    {complaint.status === 'assigned' && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={actionId === complaint.id}
                        onClick={() => void markInProgress(complaint)}
                      >
                        {t('complaint.markInProgress')}
                      </Button>
                    )}
                    {complaint.status === 'in_progress' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-amber-300 text-amber-700"
                        onClick={() =>
                          navigate(`/engineer/complaints/${complaint.id}`)
                        }
                      >
                        {t('complaint.addJobNote')}
                      </Button>
                    )}
                    {complaint.status === 'parts_provided' && (
                      <Button
                        type="button"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() =>
                          navigate(`/engineer/complaints/${complaint.id}`)
                        }
                      >
                        {t('complaint.uploadAndResolve')}
                      </Button>
                    )}
                    {complaint.status === 'resolved' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          navigate(`/engineer/complaints/${complaint.id}`)
                        }
                      >
                        {t('complaint.view')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export default MyComplaintsPage

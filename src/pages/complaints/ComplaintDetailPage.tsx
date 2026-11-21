import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { commentsApi } from '@/api/comments.api'
import { complaintsApi } from '@/api/complaints.api'
import { uploadsApi } from '@/api/uploads.api'
import { usersApi } from '@/api/users.api'
import AssignEngineerModal from '@/components/complaints/AssignEngineerModal'
import CommentSection from '@/components/complaints/CommentSection'
import FileUploadSection from '@/components/complaints/FileUploadSection'
import JobNoteCard from '@/components/complaints/JobNoteCard'
import SLATimer from '@/components/complaints/SLATimer'
import StatusBadge from '@/components/complaints/StatusBadge'
import StatusHistory from '@/components/complaints/StatusHistory'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import ErrorBanner from '@/components/common/ErrorBanner'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import RoleBadge from '@/components/common/RoleBadge'
import UserAvatar from '@/components/common/UserAvatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import type { EngineerUser } from '@/types/auth.types'
import type {
  Comment,
  Complaint,
  ComplaintStatus,
  FileUploadBatch,
  StatusHistory as StatusHistoryRecord,
  UpdateComplaintPayload,
} from '@/types/complaint.types'
import { SLA_OVERDUE_SECONDS } from '@/utils/constants'
import { getErrorMessage } from '@/utils/errors'
import { formatDate } from '@/utils/formatters'
import { logger } from '@/utils/logger'

interface EditFormValues {
  caller_name: string
  caller_phone: string
  department: string
  designation: string
  address: string
  pincode: string
  cpu_serial: string
  monitor_serial: string
}

type PendingAction =
  | { type: 'status'; status: ComplaintStatus }
  | { type: 'reopen' }

const DetailField = ({ label, value }: { label: string; value: ReactNode }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
  </div>
)

const ComplaintDetailPage = () => {
  const { t } = useTranslation()
  const params = useParams<{ id: string }>()
  const { user } = useAuth()
  const complaintId = Number(params.id)
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [history, setHistory] = useState<StatusHistoryRecord[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [uploads, setUploads] = useState<FileUploadBatch[]>([])
  const [engineers, setEngineers] = useState<EngineerUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const schema = useMemo(
    () =>
      z.object({
        caller_name: z.string(),
        caller_phone: z.string().min(1, t('validation.required')),
        department: z.string(),
        designation: z.string(),
        address: z.string(),
        pincode: z.string(),
        cpu_serial: z.string(),
        monitor_serial: z.string(),
      }),
    [t],
  )

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      caller_name: '',
      caller_phone: '',
      department: '',
      designation: '',
      address: '',
      pincode: '',
      cpu_serial: '',
      monitor_serial: '',
    },
  })

  const isAdminOrHD = user?.role === 'admin' || user?.role === 'helpdesk'
  const isEngineer = user?.role === 'engineer'
  const isAssignedEngineer =
    !!user && complaint?.assigned_engineer?.id === user.id

  const resetEditForm = (data: Complaint) => {
    editForm.reset({
      caller_name: data.caller_name ?? '',
      caller_phone: data.caller_phone,
      department: data.department ?? '',
      designation: data.designation ?? '',
      address: data.address ?? '',
      pincode: data.pincode ?? '',
      cpu_serial: data.cpu_serial ?? '',
      monitor_serial: data.monitor_serial ?? '',
    })
  }

  const loadData = async (initial: boolean) => {
    if (!Number.isFinite(complaintId)) {
      setError(t('complaint.notFound'))
      setLoading(false)
      return
    }

    if (initial) setLoading(true)
    setError(null)
    logger.info('[COMPLAINT] Loading complaint detail.', { complaintId })

    try {
      const [detailResponse, historyResponse, commentsResponse, uploadsResponse] =
        await Promise.all([
          complaintsApi.getById(complaintId),
          complaintsApi.getHistory(complaintId),
          commentsApi.list(complaintId),
          uploadsApi.list(complaintId),
        ])

      if (!detailResponse.success || !detailResponse.data) {
        throw new Error(detailResponse.message || t('complaint.notFound'))
      }

      const detail = detailResponse.data
      setComplaint(detail)
      setHistory(historyResponse.data ?? [])
      setComments(commentsResponse.data ?? [])
      setUploads(uploadsResponse.data ?? [])

      if (user?.role === 'admin' || user?.role === 'helpdesk') {
        const engineersResponse = await usersApi.engineers()
        setEngineers(engineersResponse.data ?? [])
      }

      if (initial) resetEditForm(detail)
    } catch (loadError) {
      logger.error('[COMPLAINT] Failed to load complaint.', loadError)
      setError(getErrorMessage(loadError, t('complaint.detailLoadFailed')))
    } finally {
      if (initial) setLoading(false)
    }
  }

  useEffect(() => {
    void loadData(true)
  }, [complaintId, user?.role])

  const startEdit = () => {
    if (!complaint) return
    resetEditForm(complaint)
    setEditMode(true)
  }

  const saveEdit = async (values: EditFormValues) => {
    if (!complaint) return
    setSaving(true)
    setActionError(null)

    let payload: Partial<UpdateComplaintPayload>
    if (isAdminOrHD) {
      payload = {
        caller_name: values.caller_name.trim() || null,
        caller_phone: values.caller_phone.trim(),
        department: values.department.trim() || null,
        designation: values.designation.trim() || null,
        address: values.address.trim() || null,
        pincode: values.pincode.trim() || null,
        cpu_serial: values.cpu_serial.trim() || null,
        monitor_serial: values.monitor_serial.trim() || null,
      }
    } else {
      payload = {}
      if (!complaint.cpu_serial) {
        payload.cpu_serial = values.cpu_serial.trim() || null
      }
      if (!complaint.monitor_serial) {
        payload.monitor_serial = values.monitor_serial.trim() || null
      }
    }

    try {
      await complaintsApi.update(complaint.id, payload)
      logger.info('[COMPLAINT] Complaint updated.', { complaintId: complaint.id })
      toast.success(t('complaint.complaintUpdated'))
      setEditMode(false)
      await loadData(false)
    } catch (updateError) {
      logger.error('[COMPLAINT] Failed to update complaint.', updateError)
      const message = getErrorMessage(updateError, t('errors.saveFailed'))
      setActionError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const confirmAction = async (remark?: string) => {
    if (!complaint || !pendingAction) return
    setActionLoading(true)
    setActionError(null)

    try {
      if (pendingAction.type === 'reopen') {
        await complaintsApi.reopen(complaint.id, { remark: remark ?? '' })
        logger.info('[COMPLAINT] Complaint reopened.', { complaintId: complaint.id })
        toast.success(t('complaint.reopened'))
      } else {
        await complaintsApi.updateStatus(complaint.id, {
          status: pendingAction.status,
          remark: remark?.trim() || undefined,
        })
        logger.info('[COMPLAINT] Status updated.', {
          complaintId: complaint.id,
          status: pendingAction.status,
        })
        toast.success(t('complaint.statusUpdated'))
      }
      setPendingAction(null)
      await loadData(false)
    } catch (actionFailure) {
      logger.error('[COMPLAINT] Status action failed.', actionFailure)
      const message = getErrorMessage(actionFailure, t('errors.actionFailed'))
      setActionError(message)
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  const assignedEngineerProfile = complaint?.assigned_engineer
    ? engineers.find((engineer) => engineer.id === complaint.assigned_engineer?.id)
    : undefined

  const engineerCanEdit =
    isAssignedEngineer &&
    complaint?.status !== 'closed' &&
    (!complaint?.cpu_serial || !complaint?.monitor_serial)

  if (loading) return <LoadingSpinner />

  if (error || !complaint) {
    return (
      <div>
        <ErrorBanner message={error ?? t('complaint.notFound')} onRetry={() => void loadData(true)} />
        <Button variant="outline" asChild>
          <Link to={isEngineer ? '/engineer/complaints' : '/complaints'}>
            <ArrowLeft className="h-4 w-4" />
            {isEngineer
              ? t('complaint.backToMyComplaints')
              : t('complaint.backToComplaints')}
          </Link>
        </Button>
      </div>
    )
  }

  const canEdit = complaint.status !== 'closed' && (isAdminOrHD || engineerCanEdit)
  const canViewComments = isAdminOrHD || isAssignedEngineer
  const canComment = canViewComments && complaint.status !== 'closed'
  const canUpload = isAssignedEngineer && complaint.status !== 'closed'

  const statusActionDescription = (status: ComplaintStatus): string => {
    if (status === 'resolved') return t('complaint.confirmResolvedDescription')
    if (status === 'closed') return t('complaint.confirmCloseDescription')
    if (status === 'parts_provided') return t('complaint.confirmPartsProvidedDescription')
    if (status === 'in_progress') return t('complaint.confirmInProgressDescription')
    return t('complaint.confirmStatusDescription', {
      from: t(`status.${complaint.status}`),
      to: t(`status.${status}`),
    })
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" asChild>
          <Link to={isEngineer ? '/engineer/complaints' : '/complaints'}>
            <ArrowLeft className="h-4 w-4" />
            {isEngineer
              ? t('complaint.backToMyComplaints')
              : t('complaint.backToComplaints')}
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">
            {t('common.complaintNumber', { id: complaint.id })}
          </h1>
          <StatusBadge status={complaint.status} />
        </div>
      </div>

      {actionError && <ErrorBanner message={actionError} />}

      {complaint.status === 'closed' && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {t('complaint.closedBanner')}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>{t('complaint.details')}</CardTitle>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>
                    {t('complaint.timeOpen')}:{' '}
                    <SLATimer seconds={complaint.time_open_seconds} />
                  </span>
                  <span>
                    {t('complaint.timeInStatus')}:{' '}
                    <SLATimer
                      seconds={complaint.time_in_status_seconds}
                      showRedThreshold={SLA_OVERDUE_SECONDS}
                    />
                  </span>
                  <span>{formatDate(complaint.created_at)}</span>
                </div>
              </div>
              {canEdit && !editMode && (
                <Button type="button" variant="outline" size="sm" onClick={startEdit}>
                  <Pencil className="h-4 w-4" />
                  {t('common.edit')}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editMode ? (
                <form onSubmit={editForm.handleSubmit(saveEdit)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {isAdminOrHD && (
                      <>
                        <div className="space-y-1.5">
                          <Label htmlFor="edit-caller-name">
                            {t('complaint.callerName')}
                          </Label>
                          <Input
                            id="edit-caller-name"
                            {...editForm.register('caller_name')}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="edit-caller-phone">
                            {t('complaint.callerPhone')}
                          </Label>
                          <Input
                            id="edit-caller-phone"
                            {...editForm.register('caller_phone')}
                          />
                          {editForm.formState.errors.caller_phone && (
                            <p className="text-sm text-red-600">
                              {editForm.formState.errors.caller_phone.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="edit-department">
                            {t('complaint.department')}
                          </Label>
                          <Input
                            id="edit-department"
                            {...editForm.register('department')}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="edit-designation">
                            {t('complaint.designation')}
                          </Label>
                          <Input
                            id="edit-designation"
                            {...editForm.register('designation')}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="edit-pincode">{t('complaint.pincode')}</Label>
                          <Input id="edit-pincode" {...editForm.register('pincode')} />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label htmlFor="edit-address">{t('complaint.address')}</Label>
                          <Textarea
                            id="edit-address"
                            rows={2}
                            {...editForm.register('address')}
                          />
                        </div>
                      </>
                    )}

                    {(!complaint.cpu_serial || isAdminOrHD) && (
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-cpu-serial">
                          {t('complaint.cpuSerial')}
                        </Label>
                        <Input
                          id="edit-cpu-serial"
                          {...editForm.register('cpu_serial')}
                        />
                      </div>
                    )}
                    {(!complaint.monitor_serial || isAdminOrHD) && (
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-monitor-serial">
                          {t('complaint.monitorSerial')}
                        </Label>
                        <Input
                          id="edit-monitor-serial"
                          {...editForm.register('monitor_serial')}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={saving}
                      onClick={() => {
                        resetEditForm(complaint)
                        setEditMode(false)
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? t('common.saving') : t('complaint.saveChanges')}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  <DetailField
                    label={t('complaint.callerName')}
                    value={complaint.caller_name ?? t('complaint.notRecorded')}
                  />
                  <DetailField
                    label={t('complaint.callerPhone')}
                    value={complaint.caller_phone}
                  />
                  <DetailField
                    label={t('complaint.bmid')}
                    value={complaint.bmid ?? t('complaint.notRecorded')}
                  />
                  <DetailField
                    label={t('complaint.aadhaar')}
                    value={complaint.aadhaar ?? t('complaint.notRecorded')}
                  />
                  <DetailField
                    label={t('complaint.zone')}
                    value={complaint.zone?.name ?? t('complaint.notRecorded')}
                  />
                  <DetailField
                    label={t('complaint.department')}
                    value={complaint.department ?? t('complaint.notRecorded')}
                  />
                  <DetailField
                    label={t('complaint.designation')}
                    value={complaint.designation ?? t('complaint.notRecorded')}
                  />
                  <DetailField
                    label={t('complaint.pincode')}
                    value={complaint.pincode ?? t('complaint.notRecorded')}
                  />
                  <DetailField
                    label={t('complaint.address')}
                    value={complaint.address ?? t('complaint.notRecorded')}
                  />
                  <DetailField
                    label={t('complaint.cpuSerial')}
                    value={complaint.cpu_serial ?? t('complaint.notRecorded')}
                  />
                  <DetailField
                    label={t('complaint.monitorSerial')}
                    value={complaint.monitor_serial ?? t('complaint.notRecorded')}
                  />
                  <DetailField
                    label={t('complaint.createdBy')}
                    value={complaint.created_by?.full_name ?? t('complaint.notRecorded')}
                  />
                  <div className="sm:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t('complaint.issues')}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {complaint.issues.map((issue) => (
                        <span
                          key={issue.id}
                          className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                        >
                          {issue.name}
                        </span>
                      ))}
                    </div>
                    {complaint.others_description && (
                      <p className="mt-3 rounded bg-muted px-3 py-2 text-sm text-muted-foreground">
                        {complaint.others_description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>{t('complaint.statusHistory')}</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusHistory history={history} />
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>{t('complaint.uploads')}</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploadSection
                complaintId={complaint.id}
                uploads={uploads}
                canUpload={canUpload}
                onUploaded={() => void loadData(false)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {isAdminOrHD && (
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>{t('complaint.assignedEngineerCard')}</CardTitle>
              </CardHeader>
              <CardContent>
                {complaint.assigned_engineer ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        id={complaint.assigned_engineer.id}
                        fullName={complaint.assigned_engineer.full_name}
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {complaint.assigned_engineer.full_name}
                        </p>
                        <RoleBadge
                          role={complaint.assigned_engineer.role}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    {assignedEngineerProfile &&
                      assignedEngineerProfile.current_zones.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {assignedEngineerProfile.current_zones.map((zone) => (
                            <span
                              key={zone.id}
                              className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {zone.name}
                            </span>
                          ))}
                        </div>
                      )}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={complaint.status === 'closed'}
                      onClick={() => setAssignOpen(true)}
                    >
                      {t('complaint.reassignEngineer')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {t('complaint.noEngineerAssigned')}
                    </p>
                    <Button
                      type="button"
                      className="w-full"
                      disabled={complaint.status === 'closed'}
                      onClick={() => setAssignOpen(true)}
                    >
                      {t('complaint.assignEngineer')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-border shadow-sm" id="job-note-card">
            <CardHeader>
              <CardTitle>{t('complaint.jobNote')}</CardTitle>
            </CardHeader>
            <CardContent>
              <JobNoteCard
                complaintId={complaint.id}
                jobNote={complaint.job_note}
                canSubmit={
                  isAssignedEngineer &&
                  complaint.status === 'in_progress' &&
                  !complaint.job_note
                }
                onSubmitted={() => void loadData(false)}
              />
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>{t('complaint.actions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isAdminOrHD && complaint.status === 'open' && (
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setAssignOpen(true)}
                >
                  {t('complaint.assignEngineer')}
                </Button>
              )}

              {isAssignedEngineer && complaint.status === 'assigned' && (
                <Button
                  type="button"
                  className="w-full"
                  onClick={() =>
                    setPendingAction({ type: 'status', status: 'in_progress' })
                  }
                >
                  {t('complaint.markInProgress')}
                </Button>
              )}

              {isAssignedEngineer && complaint.status === 'in_progress' && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      document
                        .getElementById('job-note-card')
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }
                  >
                    {t('complaint.submitJobNote')}
                  </Button>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() =>
                      setPendingAction({ type: 'status', status: 'resolved' })
                    }
                  >
                    {t('complaint.markResolved')}
                  </Button>
                </>
              )}

              {isAdminOrHD && complaint.status === 'parts_requested' && (
                <Button
                  type="button"
                  className="w-full"
                  onClick={() =>
                    setPendingAction({ type: 'status', status: 'parts_provided' })
                  }
                >
                  {t('complaint.markPartsProvided')}
                </Button>
              )}

              {isAssignedEngineer && complaint.status === 'parts_provided' && (
                <Button
                  type="button"
                  className="w-full"
                  onClick={() =>
                    setPendingAction({ type: 'status', status: 'resolved' })
                  }
                >
                  {t('complaint.markResolved')}
                </Button>
              )}

              {isAdminOrHD && complaint.status === 'resolved' && (
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setPendingAction({ type: 'status', status: 'closed' })}
                >
                  {t('complaint.verifyAndClose')}
                </Button>
              )}

              {user?.role === 'admin' && complaint.status === 'closed' && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setPendingAction({ type: 'reopen' })}
                >
                  {t('complaint.reopenComplaint')}
                </Button>
              )}

              {!(
                (isAdminOrHD && complaint.status === 'open') ||
                (isAssignedEngineer && complaint.status === 'assigned') ||
                (isAssignedEngineer && complaint.status === 'in_progress') ||
                (isAdminOrHD && complaint.status === 'parts_requested') ||
                (isAssignedEngineer && complaint.status === 'parts_provided') ||
                (isAdminOrHD && complaint.status === 'resolved') ||
                (user?.role === 'admin' && complaint.status === 'closed')
              ) && <p className="text-sm text-muted-foreground">{t('complaint.noActions')}</p>}
            </CardContent>
          </Card>

          {canViewComments && user && (
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>{t('complaint.comments')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CommentSection
                  complaintId={complaint.id}
                  comments={comments}
                  currentUser={user}
                  canComment={canComment}
                  onChanged={() => void loadData(false)}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AssignEngineerModal
        open={assignOpen}
        onOpenChange={setAssignOpen}
        complaintId={complaint.id}
        zoneId={complaint.zone?.id ?? null}
        currentEngineerId={complaint.assigned_engineer?.id ?? null}
        onAssigned={() => void loadData(false)}
      />

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null)
        }}
        title={
          pendingAction?.type === 'reopen'
            ? t('complaint.confirmReopenTitle')
            : t('complaint.confirmStatusTitle')
        }
        description={
          pendingAction?.type === 'reopen'
            ? t('complaint.confirmReopenDescription')
            : pendingAction?.type === 'status'
              ? statusActionDescription(pendingAction.status)
              : ''
        }
        confirmLabel={
          pendingAction?.type === 'reopen'
            ? t('complaint.reopenComplaint')
            : t('common.confirm')
        }
        onConfirm={(remark) => void confirmAction(remark)}
        loading={actionLoading}
        showRemarkInput
        remarkRequired={pendingAction?.type === 'reopen'}
        remarkPlaceholder={
          pendingAction?.type === 'reopen'
            ? t('complaint.reopenRemarkPlaceholder')
            : t('complaint.statusRemarkPlaceholder')
        }
        remarkLabel={t('complaint.statusRemark')}
      />
    </div>
  )
}

export default ComplaintDetailPage

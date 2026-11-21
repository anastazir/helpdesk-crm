import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { complaintsApi } from '@/api/complaints.api'
import { usersApi } from '@/api/users.api'
import UserAvatar from '@/components/common/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { EngineerUser } from '@/types/auth.types'
import { getErrorMessage } from '@/utils/errors'
import { logger } from '@/utils/logger'

interface AssignEngineerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  complaintId: number
  zoneId: number | null
  currentEngineerId: number | null
  onAssigned: () => void
}

interface AssignFormValues {
  engineer_id: string
  remark: string
}

const workloadClasses = (count: number): string => {
  if (count <= 2) return 'bg-green-100 text-green-700'
  if (count <= 4) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

const AssignEngineerModal = ({
  open,
  onOpenChange,
  complaintId,
  zoneId,
  currentEngineerId,
  onAssigned,
}: AssignEngineerModalProps) => {
  const { t } = useTranslation()
  const [zoneEngineers, setZoneEngineers] = useState<EngineerUser[]>([])
  const [otherEngineers, setOtherEngineers] = useState<EngineerUser[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const schema = useMemo(
    () =>
      z.object({
        engineer_id: z.string().min(1, t('assign.selectEngineer')),
        remark: z.string(),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AssignFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { engineer_id: '', remark: '' },
  })

  const selectedId = watch('engineer_id')

  const loadEngineers = async () => {
    setLoading(true)
    setError(null)
    try {
      const allResponse = await usersApi.engineers()
      const all = allResponse.data ?? []
      let inZone: EngineerUser[] = []
      if (zoneId) {
        const zoneResponse = await usersApi.engineers({ zone_id: zoneId })
        inZone = zoneResponse.data ?? []
      }
      const zoneIds = new Set(inZone.map((engineer) => engineer.id))
      setZoneEngineers(inZone)
      setOtherEngineers(all.filter((engineer) => !zoneIds.has(engineer.id)))
      reset({
        engineer_id: currentEngineerId ? String(currentEngineerId) : '',
        remark: '',
      })
    } catch (loadError) {
      logger.error('[ASSIGN] Failed to load engineers.', loadError)
      setError(getErrorMessage(loadError, t('assign.loadFailed')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      void loadEngineers()
    }
  }, [open, zoneId, currentEngineerId])

  const submit = async (values: AssignFormValues) => {
    setSubmitting(true)
    setError(null)
    try {
      await complaintsApi.assign(complaintId, {
        engineer_id: Number(values.engineer_id),
        remark: values.remark.trim() || undefined,
      })
      logger.info('[ASSIGN] Engineer assigned.', {
        complaintId,
        engineerId: values.engineer_id,
      })
      toast.success(t('assign.assignedToast'))
      onOpenChange(false)
      onAssigned()
    } catch (submitError) {
      logger.error('[ASSIGN] Failed to assign engineer.', submitError)
      const message = getErrorMessage(submitError, t('errors.actionFailed'))
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const renderEngineer = (engineer: EngineerUser, muted = false) => {
    const isSelected = selectedId === String(engineer.id)
    return (
      <label
        key={engineer.id}
        className={cn(
          'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 transition-colors',
          muted ? 'bg-slate-50 dark:bg-slate-800/60' : 'bg-white dark:bg-slate-900',
          isSelected
            ? 'border-primary ring-1 ring-primary'
            : 'border-border hover:bg-slate-50 dark:hover:bg-slate-800',
        )}
      >
        <input
          type="radio"
          value={String(engineer.id)}
          className="h-4 w-4 shrink-0 accent-primary"
          {...register('engineer_id')}
        />
        <UserAvatar id={engineer.id} fullName={engineer.full_name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium">{engineer.full_name}</span>
            {currentEngineerId === engineer.id && (
              <Badge variant="outline" className="text-[10px]">
                {t('assign.current')}
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {engineer.current_zones.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                {t('users.noEngineerZones')}
              </span>
            ) : (
              engineer.current_zones.map((zone) => (
                <span
                  key={zone.id}
                  className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                >
                  {zone.name}
                </span>
              ))
            )}
          </div>
        </div>
        <span
          className={cn(
            'flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold',
            workloadClasses(engineer.active_complaint_count),
          )}
        >
          {engineer.active_complaint_count >= 5 && (
            <AlertTriangle className="h-3 w-3" />
          )}
          {engineer.active_complaint_count >= 5
            ? t('common.highLoad')
            : t('common.activeCount', { count: engineer.active_complaint_count })}
        </span>
      </label>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {currentEngineerId ? t('assign.titleReassign') : t('assign.title')}
          </DialogTitle>
          <DialogDescription>{t('assign.selectEngineer')}</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('common.loading')}
          </p>
        ) : (
          <form onSubmit={handleSubmit(submit)} className="space-y-5">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('assign.recommended')}
              </h4>
              {zoneEngineers.length === 0 ? (
                <p className="rounded border border-dashed border-border p-3 text-sm text-muted-foreground">
                  {t('assign.noZoneEngineers')}
                </p>
              ) : (
                <div className="space-y-2">
                  {zoneEngineers.map((engineer) => renderEngineer(engineer))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('assign.others')}
              </h4>
              {otherEngineers.length === 0 ? (
                <p className="rounded border border-dashed border-border p-3 text-sm text-muted-foreground">
                  {t('assign.noEngineers')}
                </p>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {otherEngineers.map((engineer) => renderEngineer(engineer, true))}
                </div>
              )}
            </div>

            {errors.engineer_id && (
              <p className="text-sm text-red-600">{errors.engineer_id.message}</p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="assign-remark">{t('assign.remark')}</Label>
              <Textarea
                id="assign-remark"
                rows={2}
                placeholder={t('assign.remarkPlaceholder')}
                {...register('remark')}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={submitting || !selectedId}>
                {submitting
                  ? t('assign.assigning')
                  : currentEngineerId
                    ? t('assign.confirmReassign')
                    : t('assign.confirm')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AssignEngineerModal

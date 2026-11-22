import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, Pencil, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { usersApi } from '@/api/users.api'
import { zonesApi } from '@/api/zones.api'
import ErrorBanner from '@/components/common/ErrorBanner'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import PageHeader from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { EngineerUser } from '@/types/auth.types'
import type { Zone } from '@/types/zone.types'
import { getErrorMessage } from '@/utils/errors'
import { logger } from '@/utils/logger'

const zoneNameSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().trim().min(1, t('validation.required')),
  })

type ZoneNameFormValues = z.infer<ReturnType<typeof zoneNameSchema>>

interface AddZoneRowProps {
  onCreated: () => void
  onCancel: () => void
}

const AddZoneRow = ({ onCreated, onCancel }: AddZoneRowProps) => {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const schema = useMemo(() => zoneNameSchema(t), [t])
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ZoneNameFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  })

  const submit = async (values: ZoneNameFormValues) => {
    setSubmitting(true)
    setError(null)
    try {
      await zonesApi.create({ name: values.name })
      logger.info('[ZONES] Zone created.', { name: values.name })
      toast.success(t('zones.zoneCreatedToast'))
      reset({ name: '' })
      onCreated()
    } catch (createError) {
      logger.error('[ZONES] Failed to create zone.', createError)
      const message = getErrorMessage(createError, t('zones.addFailed'))
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="flex flex-col gap-2 border-t border-border p-4 sm:flex-row sm:items-start"
    >
      <div className="flex-1">
        <Input
          autoFocus
          placeholder={t('zones.zoneNamePlaceholder')}
          {...register('name')}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? t('zones.creating') : t('zones.create')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          {t('zones.cancel')}
        </Button>
      </div>
    </form>
  )
}

interface EditZoneFormProps {
  zone: Zone
  onSaved: () => void
  onCancel: () => void
}

const EditZoneForm = ({ zone, onSaved, onCancel }: EditZoneFormProps) => {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const schema = useMemo(() => zoneNameSchema(t), [t])
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ZoneNameFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: zone.name },
  })

  const submit = async (values: ZoneNameFormValues) => {
    setSubmitting(true)
    setError(null)
    try {
      await zonesApi.update(zone.id, { name: values.name })
      logger.info('[ZONES] Zone updated.', { zoneId: zone.id })
      toast.success(t('zones.zoneUpdatedToast'))
      onSaved()
    } catch (updateError) {
      logger.error('[ZONES] Failed to update zone.', updateError)
      const message = getErrorMessage(updateError, t('zones.updateFailed'))
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-1 flex-col gap-1">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input className="max-w-xs" autoFocus {...register('name')} />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? t('zones.saving') : t('zones.save')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={submitting}
            onClick={onCancel}
          >
            {t('zones.cancel')}
          </Button>
        </div>
      </div>
      {errors.name && (
        <p className="text-sm text-red-600">{errors.name.message}</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}

const ZonesPage = () => {
  const { t } = useTranslation()
  const [zones, setZones] = useState<Zone[]>([])
  const [engineers, setEngineers] = useState<EngineerUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    logger.info('[ZONES] Loading zones and engineers.')
    try {
      const [zonesResponse, engineersResponse] = await Promise.all([
        zonesApi.list(),
        usersApi.engineers(),
      ])
      setZones(zonesResponse.data ?? [])
      setEngineers(engineersResponse.data ?? [])
    } catch (loadError) {
      logger.error('[ZONES] Failed to load zones.', loadError)
      setError(getErrorMessage(loadError, t('zones.loadFailed')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const toggleActive = async (zone: Zone, active: boolean) => {
    setTogglingId(zone.id)
    try {
      await zonesApi.update(zone.id, { is_active: active })
      setZones((current) =>
        current.map((item) =>
          item.id === zone.id ? { ...item, is_active: active } : item,
        ),
      )
      logger.info('[ZONES] Zone status updated.', { zoneId: zone.id, active })
      toast.success(t('zones.zoneUpdatedToast'))
    } catch (updateError) {
      logger.error('[ZONES] Failed to toggle zone status.', updateError)
      toast.error(getErrorMessage(updateError, t('zones.updateFailed')))
    } finally {
      setTogglingId(null)
    }
  }

  const engineersForZone = (zoneId: number) =>
    engineers.filter((engineer) =>
      engineer.current_zones.some((zone) => zone.id === zoneId),
    )

  if (loading) return <LoadingSpinner />

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={t('zones.title')}
        description={t('zones.subtitle')}
        actions={
          <Button type="button" onClick={() => setAdding(true)} disabled={adding}>
            <Plus className="h-4 w-4" />
            {t('zones.addZone')}
          </Button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={() => void loadData()} />}

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          {zones.length === 0 && !adding ? (
            <p className="p-6 text-sm text-muted-foreground">{t('zones.noZones')}</p>
          ) : (
            <div className="divide-y divide-border">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="flex flex-col gap-3 bg-white p-4 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded bg-blue-50 text-primary">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {editingId === zone.id ? (
                        <EditZoneForm
                          zone={zone}
                          onSaved={() => {
                            setEditingId(null)
                            void loadData()
                          }}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold">{zone.name}</p>
                            <Badge className="rounded bg-slate-100 text-slate-600">
                              {t('zones.complaintCount', {
                                count: zone.complaint_count ?? 0,
                              })}
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {engineersForZone(zone.id).length === 0 ? (
                              <span className="text-xs text-muted-foreground">
                                {t('zones.noEngineers')}
                              </span>
                            ) : (
                              engineersForZone(zone.id).map((engineer) => (
                                <span
                                  key={engineer.id}
                                  className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                >
                                  {engineer.full_name}
                                </span>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={zone.is_active}
                        disabled={togglingId === zone.id}
                        onCheckedChange={(checked) => void toggleActive(zone, checked)}
                        aria-label={t('zones.status')}
                      />
                      <span
                        className={cn(
                          'text-xs font-medium',
                          zone.is_active
                            ? 'text-green-700'
                            : 'text-muted-foreground',
                        )}
                      >
                        {zone.is_active ? t('zones.active') : t('zones.inactive')}
                      </span>
                    </div>
                    {editingId !== zone.id && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t('zones.editZone')}
                        onClick={() => setEditingId(zone.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {adding && (
            <AddZoneRow
              onCreated={() => {
                setAdding(false)
                void loadData()
              }}
              onCancel={() => setAdding(false)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ZonesPage

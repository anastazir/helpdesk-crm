import { useEffect, useMemo, useState } from 'react'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { zodResolver } from '@hookform/resolvers/zod'
import { Download, GripVertical, Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { exportApi } from '@/api/export.api'
import { usersApi } from '@/api/users.api'
import { zonesApi } from '@/api/zones.api'
import ErrorBanner from '@/components/common/ErrorBanner'
import PageHeader from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { EngineerUser } from '@/types/auth.types'
import type { ComplaintStatus } from '@/types/complaint.types'
import type {
  ExportColumnKey,
  ExportFilters,
  ExportPreview,
} from '@/types/export.types'
import type { Zone } from '@/types/zone.types'
import { STATUS_ORDER } from '@/utils/constants'
import { getErrorMessage } from '@/utils/errors'
import { logger } from '@/utils/logger'

const ALL_COLUMNS: ExportColumnKey[] = [
  'id',
  'caller_name',
  'caller_phone',
  'zone',
  'issues',
  'status',
  'assigned_engineer',
  'cpu_serial',
  'monitor_serial',
  'created_at',
  'time_open',
  'department',
  'designation',
  'bmid',
  'address',
  'pincode',
]

const exportSchema = z.object({
  zone_id: z.string(),
  status: z.string(),
  date_from: z.string(),
  date_to: z.string(),
  assigned_engineer_id: z.string(),
  cpu_serial_contains: z.string(),
  deduplicate: z.boolean(),
})

type ExportFormValues = z.infer<typeof exportSchema>

interface SortableColumnRowProps {
  column: ExportColumnKey
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

const SortableColumnRow = ({
  column,
  checked,
  onCheckedChange,
}: SortableColumnRowProps) => {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: column })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'flex items-center gap-3 rounded-md border border-border bg-white px-3 py-2 dark:bg-slate-900',
        isDragging && 'opacity-70 shadow-lg',
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label={t('export.columnsHint')}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <span className="text-sm">{t(`export.columnLabels.${column}`)}</span>
    </div>
  )
}

const ExportPage = () => {
  const { t } = useTranslation()
  const [zones, setZones] = useState<Zone[]>([])
  const [engineers, setEngineers] = useState<EngineerUser[]>([])
  const [orderedColumns, setOrderedColumns] = useState<ExportColumnKey[]>(ALL_COLUMNS)
  const [selectedColumns, setSelectedColumns] = useState<ExportColumnKey[]>(ALL_COLUMNS)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ExportPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  const { control, register, watch } = useForm<ExportFormValues>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      zone_id: '',
      status: '',
      date_from: '',
      date_to: '',
      assigned_engineer_id: '',
      cpu_serial_contains: '',
      deduplicate: false,
    },
  })

  const values = watch()
  const selectedKey = selectedColumns.join(',')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    const loadOptions = async () => {
      setOptionsError(null)
      try {
        const [zonesResponse, engineersResponse] = await Promise.all([
          zonesApi.list(),
          usersApi.engineers(),
        ])
        setZones(zonesResponse.data ?? [])
        setEngineers(engineersResponse.data ?? [])
      } catch (loadError) {
        logger.error('[EXPORT] Failed to load export options.', loadError)
        setOptionsError(getErrorMessage(loadError, t('export.loadFailed')))
      }
    }
    void loadOptions()
  }, [t])

  const buildFilters = (data: ExportFormValues): ExportFilters => ({
    zone_id: data.zone_id ? Number(data.zone_id) : null,
    status: data.status ? (data.status as ComplaintStatus) : null,
    date_from: data.date_from || null,
    date_to: data.date_to || null,
    assigned_engineer_id: data.assigned_engineer_id
      ? Number(data.assigned_engineer_id)
      : null,
    cpu_serial_contains: data.cpu_serial_contains.trim() || null,
  })

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(async () => {
      setPreviewLoading(true)
      setPreviewError(null)
      try {
        const response = await exportApi.preview({
          filters: buildFilters(values),
          deduplicate: values.deduplicate,
        })
        if (!cancelled) setPreview(response.data)
      } catch (previewFailure) {
        if (!cancelled) {
          logger.error('[EXPORT] Preview failed.', previewFailure)
          setPreviewError(
            getErrorMessage(previewFailure, t('export.previewFailed')),
          )
        }
      } finally {
        if (!cancelled) setPreviewLoading(false)
      }
    }, 500)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [
    values.zone_id,
    values.status,
    values.date_from,
    values.date_to,
    values.assigned_engineer_id,
    values.cpu_serial_contains,
    values.deduplicate,
    selectedKey,
    t,
  ])

  const toggleColumn = (column: ExportColumnKey, checked: boolean) => {
    setSelectedColumns((current) =>
      checked
        ? orderedColumns.filter(
            (item) => current.includes(item) || item === column,
          )
        : current.filter((item) => item !== column),
    )
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = orderedColumns.indexOf(active.id as ExportColumnKey)
    const newIndex = orderedColumns.indexOf(over.id as ExportColumnKey)
    const nextOrder = arrayMove(orderedColumns, oldIndex, newIndex)
    setOrderedColumns(nextOrder)
    setSelectedColumns((current) =>
      nextOrder.filter((column) => current.includes(column)),
    )
  }

  const selectAll = () => {
    setSelectedColumns(orderedColumns)
  }

  const clearAll = () => {
    setSelectedColumns([])
  }

  const download = async () => {
    if (selectedColumns.length === 0) {
      toast.error(t('export.selectColumnsError'))
      return
    }

    setDownloading(true)
    try {
      await exportApi.download({
        columns: selectedColumns,
        column_order: selectedColumns,
        filters: buildFilters(values),
        deduplicate: values.deduplicate,
      })
      logger.info('[EXPORT] Export downloaded.')
      toast.success(t('export.downloadStarted'))
    } catch (downloadError) {
      logger.error('[EXPORT] Download failed.', downloadError)
      toast.error(getErrorMessage(downloadError, t('export.downloadFailed')))
    } finally {
      setDownloading(false)
    }
  }

  const previewColumns = useMemo(
    () => selectedColumns.slice(0, 5),
    [selectedColumns],
  )

  return (
    <div>
      <PageHeader title={t('export.title')} description={t('export.subtitle')} />

      {optionsError && (
        <ErrorBanner message={optionsError} onRetry={() => window.location.reload()} />
      )}

      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{t('export.columns')}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('export.columnsHint')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="link" size="sm" onClick={selectAll}>
                  {t('export.selectAll')}
                </Button>
                <Button type="button" variant="link" size="sm" onClick={clearAll}>
                  {t('export.clearAll')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={orderedColumns}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {orderedColumns.map((column) => (
                      <SortableColumnRow
                        key={column}
                        column={column}
                        checked={selectedColumns.includes(column)}
                        onCheckedChange={(checked) => toggleColumn(column, checked)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>{t('export.filters')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t('complaint.zone')}</Label>
                <Controller
                  control={control}
                  name="zone_id"
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
                        {STATUS_ORDER.map((status) => (
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
                <Label>{t('complaint.assignedEngineer')}</Label>
                <Controller
                  control={control}
                  name="assigned_engineer_id"
                  render={({ field }) => (
                    <Select
                      value={field.value || 'all'}
                      onValueChange={(value) =>
                        field.onChange(value === 'all' ? '' : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.allEngineers')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.allEngineers')}</SelectItem>
                        {engineers.map((engineer) => (
                          <SelectItem key={engineer.id} value={String(engineer.id)}>
                            {engineer.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="export-cpu">{t('export.cpuSerialContains')}</Label>
                <Input id="export-cpu" {...register('cpu_serial_contains')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="export-date-from">{t('export.dateFrom')}</Label>
                <Input id="export-date-from" type="date" {...register('date_from')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="export-date-to">{t('export.dateTo')}</Label>
                <Input id="export-date-to" type="date" {...register('date_to')} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>{t('export.deduplication')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                control={control}
                name="deduplicate"
                render={({ field }) => (
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{t('export.dedupLabel')}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t('export.dedupDescription')}
                      </p>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label={t('export.dedupLabel')}
                    />
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-border shadow-sm xl:sticky xl:top-20">
            <CardHeader>
              <CardTitle>{t('export.preview')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {previewError && (
                <p className="text-sm text-red-600">{previewError}</p>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('export.totalMatching')}
                  </span>
                  <span className="font-semibold">
                    {previewLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      (preview?.total_matching ?? 0)
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('export.afterDedup')}
                  </span>
                  <span className="font-semibold">
                    {preview?.after_deduplication ?? 0}
                  </span>
                </div>
                {(preview?.deduplicated_count ?? 0) > 0 && (
                  <p className="text-xs font-medium text-amber-600">
                    {t('export.deduplicated', {
                      count: preview?.deduplicated_count ?? 0,
                    })}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('export.columnsSelected')}
                  </span>
                  <span className="font-semibold">{selectedColumns.length}</span>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('export.miniPreview')}
                </p>
                {previewColumns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t('export.miniPreviewEmpty')}
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {previewColumns.map((column) => (
                            <TableHead key={column} className="whitespace-nowrap text-xs">
                              {t(`export.columnLabels.${column}`)}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[0, 1, 2].map((row) => (
                          <TableRow key={row}>
                            {previewColumns.map((column) => (
                              <TableCell key={column}>
                                <Skeleton className="h-4 w-16" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={() => void download()}
                disabled={downloading || selectedColumns.length === 0}
              >
                <Download className="h-4 w-4" />
                {downloading ? t('export.downloading') : t('export.downloadExcel')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ExportPage

import { useEffect, useState } from 'react'
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
import { useAuth } from '@/hooks/useAuth'
import AiExportSummaryCard from '@/components/export/AiExportSummaryCard'
import { useAppSelector } from '@/store/hooks'
import { zonesApi } from '@/api/zones.api'
import ErrorBanner from '@/components/common/ErrorBanner'
import MultiSelectFilter from '@/components/common/MultiSelectFilter'
import PageHeader from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  zone_ids: z.array(z.string()),
  statuses: z.array(z.string()),
  date_from: z.string(),
  date_to: z.string(),
  assigned_engineer_ids: z.array(z.string()),
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
  const { user } = useAuth()
  const aiEnabled = useAppSelector((state) => state.assistant.aiEnabled)
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
      zone_ids: [],
      statuses: [],
      date_from: '',
      date_to: '',
      assigned_engineer_ids: [],
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
    zone_ids: data.zone_ids.map(Number),
    statuses: data.statuses as ComplaintStatus[],
    date_from: data.date_from || null,
    date_to: data.date_to || null,
    assigned_engineer_ids: data.assigned_engineer_ids.map(Number),
    cpu_serial_contains: data.cpu_serial_contains.trim() || null,
  })

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(async () => {
      setPreviewLoading(true)
      setPreviewError(null)
      try {
        const response = await exportApi.preview({
          columns: selectedColumns,
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
    values.zone_ids.join(','),
    values.statuses.join(','),
    values.date_from,
    values.date_to,
    values.assigned_engineer_ids.join(','),
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

  const previewColumns = preview?.columns ?? selectedColumns
  const previewRows = preview?.rows ?? []
  const zoneOptions = zones.map((zone) => ({
    value: String(zone.id),
    label: zone.name,
  }))
  const statusOptions = STATUS_ORDER.map((status) => ({
    value: status,
    label: t(`status.${status}`),
  }))
  const engineerOptions = engineers.map((engineer) => ({
    value: String(engineer.id),
    label: engineer.full_name,
  }))

  return (
    <div>
      <PageHeader title={t('export.title')} description={t('export.subtitle')} />

      {optionsError && (
        <ErrorBanner message={optionsError} onRetry={() => window.location.reload()} />
      )}

      <div className="grid gap-6 xl:grid-cols-2">
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
                  <div className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
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

          <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>{t('export.filters')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t('complaint.zone')}</Label>
                <Controller
                  control={control}
                  name="zone_ids"
                  render={({ field }) => (
                    <MultiSelectFilter
                      label={t('complaint.zone')}
                      placeholder={t('common.allZones')}
                      options={zoneOptions}
                      selected={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t('complaint.status')}</Label>
                <Controller
                  control={control}
                  name="statuses"
                  render={({ field }) => (
                    <MultiSelectFilter
                      label={t('complaint.status')}
                      placeholder={t('common.allStatuses')}
                      options={statusOptions}
                      selected={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t('complaint.assignedEngineer')}</Label>
                <Controller
                  control={control}
                  name="assigned_engineer_ids"
                  render={({ field }) => (
                    <MultiSelectFilter
                      label={t('complaint.assignedEngineer')}
                      placeholder={t('common.allEngineers')}
                      options={engineerOptions}
                      selected={field.value}
                      onChange={field.onChange}
                    />
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
      </div>

        {aiEnabled && user?.role === 'admin' && (
          <AiExportSummaryCard
            filters={buildFilters(values)}
            deduplicate={values.deduplicate}
          />
        )}

        <Card className="border-border shadow-sm">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{t('export.preview')}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('export.previewSubtitle')}
                </p>
              </div>
              {previewLoading && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
            </CardHeader>
            <CardContent className="space-y-5">
              {previewError && (
                <p className="text-sm text-red-600">{previewError}</p>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('export.totalMatching')}
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {previewLoading ? '—' : (preview?.total_matching ?? 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('export.afterDedup')}
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {previewLoading ? '—' : (preview?.after_deduplication ?? 0)}
                  </p>
                  {(preview?.deduplicated_count ?? 0) > 0 && (
                    <p className="mt-1 text-xs font-medium text-amber-600">
                      {t('export.deduplicated', {
                        count: preview?.deduplicated_count ?? 0,
                      })}
                    </p>
                  )}
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('export.columnsSelected')}
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {selectedColumns.length}
                  </p>
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
                ) : previewRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {previewLoading
                      ? t('common.loading')
                      : t('export.noPreviewRows')}
                  </p>
                ) : (
                  <div className="max-h-[30rem] overflow-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-muted">
                        <TableRow>
                          {previewColumns.map((column) => (
                            <TableHead
                              key={column}
                              className="whitespace-nowrap text-xs"
                            >
                              {t(`export.columnLabels.${column}`)}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewRows.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {previewColumns.map((column) => {
                              const value = row[column]
                              return (
                                <TableCell
                                  key={column}
                                  className="whitespace-nowrap text-sm"
                                >
                                  {value === null ||
                                  value === undefined ||
                                  value === ''
                                    ? '—'
                                    : String(value)}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {t('export.previewRowsNote', {
                    shown: previewRows.length,
                    total: preview?.after_deduplication ?? 0,
                  })}
                </p>
                <Button
                  type="button"
                  onClick={() => void download()}
                  disabled={downloading || selectedColumns.length === 0}
                >
                  <Download className="h-4 w-4" />
                  {downloading ? t('export.downloading') : t('export.downloadExcel')}
                </Button>
              </div>
            </CardContent>
          </Card>

    </div>
  )
}

export default ExportPage

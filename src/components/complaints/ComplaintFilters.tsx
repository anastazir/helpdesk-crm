import { useEffect, useMemo, useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import MultiSelectFilter from '@/components/common/MultiSelectFilter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { EngineerUser } from '@/types/auth.types'
import type { Zone } from '@/types/zone.types'

export interface ComplaintFilterValues {
  search: string
  zone_ids: string[]
  assigned_engineer_ids: string[]
  dateFrom: string
  dateTo: string
}

interface ComplaintFiltersProps {
  values: ComplaintFilterValues
  zones: Zone[]
  engineers: EngineerUser[]
  onChange: (values: ComplaintFilterValues) => void
  onReset: () => void
}

const ComplaintFilters = ({
  values,
  zones,
  engineers,
  onChange,
  onReset,
}: ComplaintFiltersProps) => {
  const { t } = useTranslation()
  const filtersInitialized = useRef(false)

  const schema = useMemo(
    () =>
      z.object({
        search: z.string(),
        zone_ids: z.array(z.string()),
        assigned_engineer_ids: z.array(z.string()),
        dateFrom: z.string(),
        dateTo: z.string(),
      }),
    [],
  )

  const { register, handleSubmit, control, reset, watch } =
    useForm<ComplaintFilterValues>({
      resolver: zodResolver(schema),
      defaultValues: values,
    })

  const selectedZones = watch('zone_ids')
  const selectedEngineers = watch('assigned_engineer_ids')
  const search = watch('search')
  const dateFrom = watch('dateFrom')
  const dateTo = watch('dateTo')
  const zoneKey = selectedZones.join(',')
  const engineerKey = selectedEngineers.join(',')

  useEffect(() => {
    if (!filtersInitialized.current) {
      filtersInitialized.current = true
      return
    }
    const timer = setTimeout(() => {
      onChange({
        search,
        zone_ids: selectedZones,
        assigned_engineer_ids: selectedEngineers,
        dateFrom,
        dateTo,
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [zoneKey, engineerKey, search, dateFrom, dateTo])

  const submit = (data: ComplaintFilterValues) => {
    onChange(data)
  }

  const handleReset = () => {
    reset({
      search: '',
      zone_ids: [],
      assigned_engineer_ids: [],
      dateFrom: '',
      dateTo: '',
    })
    onReset()
  }

  const zoneOptions = zones.map((zone) => ({
    value: String(zone.id),
    label: zone.name,
  }))
  const engineerOptions = engineers.map((engineer) => ({
    value: String(engineer.id),
    label: engineer.full_name,
  }))

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="mb-4 rounded-lg border border-border bg-white p-4 dark:bg-slate-900"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="space-y-1.5 xl:col-span-2">
          <Label htmlFor="complaint-search">{t('common.search')}</Label>
          <Input
            id="complaint-search"
            placeholder={t('filters.searchComplaints')}
            {...register('search')}
          />
        </div>

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
          <Label htmlFor="complaint-date-from">{t('filters.dateFrom')}</Label>
          <Input id="complaint-date-from" type="date" {...register('dateFrom')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="complaint-date-to">{t('filters.dateTo')}</Label>
          <Input id="complaint-date-to" type="date" {...register('dateTo')} />
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <Button type="button" variant="outline" onClick={handleReset}>
          {t('common.reset')}
        </Button>
      </div>
    </form>
  )
}

export default ComplaintFilters

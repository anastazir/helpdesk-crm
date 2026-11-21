import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { EngineerUser } from '@/types/auth.types'
import type { Zone } from '@/types/zone.types'

export interface ComplaintFilterValues {
  search: string
  zone: string
  assigned_engineer: string
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

  const schema = useMemo(
    () =>
      z.object({
        search: z.string(),
        zone: z.string(),
        assigned_engineer: z.string(),
        dateFrom: z.string(),
        dateTo: z.string(),
      }),
    [],
  )

  const { register, handleSubmit, control, reset } = useForm<ComplaintFilterValues>({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  const submit = (data: ComplaintFilterValues) => {
    onChange(data)
  }

  const handleReset = () => {
    reset({
      search: '',
      zone: '',
      assigned_engineer: '',
      dateFrom: '',
      dateTo: '',
    })
    onReset()
  }

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
            name="zone"
            render={({ field }) => (
              <Select
                value={field.value || 'all'}
                onValueChange={(value) => field.onChange(value === 'all' ? '' : value)}
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
          <Label>{t('complaint.assignedEngineer')}</Label>
          <Controller
            control={control}
            name="assigned_engineer"
            render={({ field }) => (
              <Select
                value={field.value || 'all'}
                onValueChange={(value) => field.onChange(value === 'all' ? '' : value)}
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
          <Label htmlFor="complaint-date-from">{t('filters.dateFrom')}</Label>
          <Input id="complaint-date-from" type="date" {...register('dateFrom')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="complaint-date-to">{t('filters.dateTo')}</Label>
          <Input id="complaint-date-to" type="date" {...register('dateTo')} />
        </div>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={handleReset}>
          {t('common.reset')}
        </Button>
        <Button type="submit">{t('common.apply')}</Button>
      </div>
    </form>
  )
}

export default ComplaintFilters

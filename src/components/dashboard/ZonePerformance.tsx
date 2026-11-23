import { useTranslation } from 'react-i18next'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type {
  ComplaintPeriod,
  ZonePerformanceRow,
} from '@/types/complaint.types'

interface ZonePerformanceProps {
  rows: ZonePerformanceRow[]
  period: ComplaintPeriod | null
  onPeriodChange: (period: ComplaintPeriod | null) => void
  onMetricClick: (row: ZonePerformanceRow, metric: 'total' | 'active' | 'closed') => void
  onEngineersClick: (row: ZonePerformanceRow) => void
}

const ZonePerformance = ({
  rows,
  period,
  onPeriodChange,
  onMetricClick,
  onEngineersClick,
}: ZonePerformanceProps) => {
  const { t } = useTranslation()
  const periods: Array<{ value: ComplaintPeriod | null; labelKey: string }> = [
    { value: null, labelKey: 'dashboard.allTime' },
    { value: 'today', labelKey: 'complaint.kpi.today' },
    { value: 'week', labelKey: 'complaint.kpi.week' },
    { value: 'month', labelKey: 'complaint.kpi.month' },
    { value: 'last_month', labelKey: 'complaint.kpi.lastMonth' },
  ]

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('dashboard.noZones')}</p>
  }

  return (
    <div className="w-full min-w-0">
      <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {periods.map((option) => {
          const active = period === option.value
          return (
            <button
              key={option.value ?? 'all'}
              type="button"
              aria-pressed={active}
              onClick={() => onPeriodChange(option.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:bg-background hover:text-foreground'
              }`}
            >
              {t(option.labelKey)}
            </button>
          )
        })}
      </div>
      <div className="w-full min-w-0 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('dashboard.zoneColumn')}</TableHead>
            <TableHead className="text-right">{t('dashboard.totalColumn')}</TableHead>
            <TableHead className="text-right">{t('dashboard.activeColumn')}</TableHead>
            <TableHead className="text-right">{t('dashboard.closedColumn')}</TableHead>
            <TableHead className="text-right">
              {t('dashboard.engineersColumn')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.zone_id}>
              <TableCell className="font-medium">{row.zone_name}</TableCell>
              {(['total', 'active', 'closed'] as const).map((metric) => (
                <TableCell key={metric} className="text-right">
                  <button
                    type="button"
                    className="rounded px-2 py-1 font-medium text-primary hover:bg-primary/10"
                    onClick={() => onMetricClick(row, metric)}
                  >
                    {row[metric]}
                  </button>
                </TableCell>
              ))}
              <TableCell className="text-right">
                <button
                  type="button"
                  className="rounded px-2 py-1 font-medium text-primary hover:bg-primary/10"
                  onClick={() => onEngineersClick(row)}
                >
                  {row.engineers}
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ZonePerformance

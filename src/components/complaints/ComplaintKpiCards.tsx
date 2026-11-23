import { CalendarDays, CalendarRange, CalendarSearch, Layers, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ComplaintKpis, ComplaintPeriod } from '@/types/complaint.types'

interface ComplaintKpiCardsProps {
  kpis: ComplaintKpis | null
  selected: ComplaintPeriod | null
  loading?: boolean
  onSelect: (period: ComplaintPeriod) => void
}

const CARDS: Array<{
  period: ComplaintPeriod
  labelKey: string
  valueKey: keyof Pick<ComplaintKpis, 'total' | 'today' | 'week' | 'month' | 'last_month'>
  icon: typeof Layers
  tone: string
}> = [
  { period: 'total', labelKey: 'complaint.kpi.total', valueKey: 'total', icon: Layers, tone: 'text-violet-600' },
  { period: 'today', labelKey: 'complaint.kpi.today', valueKey: 'today', icon: Sun, tone: 'text-amber-600' },
  { period: 'week', labelKey: 'complaint.kpi.week', valueKey: 'week', icon: CalendarDays, tone: 'text-blue-600' },
  { period: 'month', labelKey: 'complaint.kpi.month', valueKey: 'month', icon: CalendarRange, tone: 'text-emerald-600' },
  { period: 'last_month', labelKey: 'complaint.kpi.lastMonth', valueKey: 'last_month', icon: CalendarSearch, tone: 'text-rose-600' },
]

const ComplaintKpiCards = ({
  kpis,
  selected,
  loading,
  onSelect,
}: ComplaintKpiCardsProps) => {
  const { t } = useTranslation()
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {CARDS.map((card) => {
        const Icon = card.icon
        const active = selected === card.period
        return (
          <Card
            key={card.period}
            role="button"
            tabIndex={0}
            aria-pressed={active}
            onClick={() => onSelect(card.period)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect(card.period)
              }
            }}
            className={cn(
              'min-w-0 cursor-pointer border-border p-4 shadow-sm transition-colors',
              active
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'hover:border-primary/40',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t(card.labelKey)}
              </p>
              <Icon className={cn('h-4 w-4', card.tone)} />
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums">
              {loading || !kpis ? '—' : kpis[card.valueKey]}
            </p>
          </Card>
        )
      })}
    </div>
  )
}

export default ComplaintKpiCards

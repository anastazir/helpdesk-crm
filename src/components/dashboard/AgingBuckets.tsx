import { useTranslation } from 'react-i18next'

import type { ComplaintListItem } from '@/types/complaint.types'

interface AgingBucketsProps {
  complaints: ComplaintListItem[]
}

const DAY = 24 * 60 * 60

const AgingBuckets = ({ complaints }: AgingBucketsProps) => {
  const { t } = useTranslation()
  const unresolved = complaints.filter(
    (complaint) => complaint.status !== 'closed',
  )

  const buckets = [
    {
      key: 'under24h',
      label: t('dashboard.under24h'),
      count: unresolved.filter(
        (complaint) => complaint.time_open_seconds < DAY,
      ).length,
      color: '#22C55E',
    },
    {
      key: 'oneToThree',
      label: t('dashboard.oneToThreeDays'),
      count: unresolved.filter(
        (complaint) =>
          complaint.time_open_seconds >= DAY &&
          complaint.time_open_seconds < 3 * DAY,
      ).length,
      color: '#F59E0B',
    },
    {
      key: 'threeToSeven',
      label: t('dashboard.threeToSevenDays'),
      count: unresolved.filter(
        (complaint) =>
          complaint.time_open_seconds >= 3 * DAY &&
          complaint.time_open_seconds < 7 * DAY,
      ).length,
      color: '#F97316',
    },
    {
      key: 'overSeven',
      label: t('dashboard.overSevenDays'),
      count: unresolved.filter(
        (complaint) => complaint.time_open_seconds >= 7 * DAY,
      ).length,
      color: '#EF4444',
    },
  ]

  const total = unresolved.length

  return (
    <div className="space-y-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {total > 0 &&
          buckets.map((bucket) => (
            <div
              key={bucket.key}
              style={{
                width: `${(bucket.count / total) * 100}%`,
                backgroundColor: bucket.color,
              }}
            />
          ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {buckets.map((bucket) => (
          <div
            key={bucket.key}
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
          >
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: bucket.color }}
              />
              {bucket.label}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {bucket.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AgingBuckets

import { useTranslation } from 'react-i18next'

import type { ComplaintListItem } from '@/types/complaint.types'

interface IssueHotspotsProps {
  complaints: ComplaintListItem[]
}

const IssueHotspots = ({ complaints }: IssueHotspotsProps) => {
  const { t } = useTranslation()
  const counts = new Map<string, number>()

  complaints.forEach((complaint) => {
    complaint.issues.forEach((issue) => {
      counts.set(issue.name, (counts.get(issue.name) ?? 0) + 1)
    })
  })

  const topIssues = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
  const maxCount = Math.max(1, ...topIssues.map(([, count]) => count))

  if (topIssues.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('dashboard.noIssueData')}</p>
  }

  return (
    <div className="space-y-3">
      {topIssues.map(([name, count]) => (
        <div key={name}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-muted-foreground">{name}</span>
            <span className="shrink-0 font-semibold text-foreground">{count}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded bg-muted">
            <div
              className="h-full rounded bg-primary"
              style={{ width: `${(count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default IssueHotspots

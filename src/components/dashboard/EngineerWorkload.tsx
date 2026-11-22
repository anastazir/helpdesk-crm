import { useTranslation } from 'react-i18next'

import UserAvatar from '@/components/common/UserAvatar'
import { cn } from '@/lib/utils'
import type { EngineerUser } from '@/types/auth.types'

interface EngineerWorkloadProps {
  engineers: EngineerUser[]
}

const workloadColor = (count: number): string => {
  if (count <= 2) return 'bg-green-500'
  if (count <= 4) return 'bg-amber-500'
  return 'bg-red-500'
}

const workloadPill = (count: number): string => {
  if (count <= 2) return 'bg-green-100 text-green-700'
  if (count <= 4) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

const EngineerWorkload = ({ engineers }: EngineerWorkloadProps) => {
  const { t } = useTranslation()
  const sorted = [...engineers]
    .sort((a, b) => b.active_complaint_count - a.active_complaint_count)
    .slice(0, 6)
  const maxCount = Math.max(
    1,
    ...sorted.map((engineer) => engineer.active_complaint_count),
  )

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t('dashboard.noEngineers')}</p>
    )
  }

  return (
    <div className="space-y-4">
      {sorted.map((engineer) => (
        <div key={engineer.id} className="flex items-start gap-3">
          <UserAvatar id={engineer.id} fullName={engineer.full_name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">
                {engineer.full_name}
              </span>
              <span
                className={cn(
                  'shrink-0 rounded px-2 py-0.5 text-xs font-semibold',
                  workloadPill(engineer.active_complaint_count),
                )}
              >
                {t('common.activeCount', {
                  count: engineer.active_complaint_count,
                })}
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded bg-muted">
              <div
                className={cn('h-full rounded', workloadColor(engineer.active_complaint_count))}
                style={{
                  width: `${(engineer.active_complaint_count / maxCount) * 100}%`,
                }}
              />
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {engineer.current_zones.map((zone) => zone.name).join(', ') ||
                t('users.noEngineerZones')}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default EngineerWorkload

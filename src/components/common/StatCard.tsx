import type { LucideIcon } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number | string
  hint?: string
  icon?: LucideIcon
  className?: string
  valueClassName?: string
  iconClassName?: string
  onClick?: () => void
}

const StatCard = ({
  title,
  value,
  hint,
  icon: Icon,
  className,
  valueClassName,
  iconClassName,
  onClick,
}: StatCardProps) => (
  <Card
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onClick={onClick}
    onKeyDown={(event) => {
      if (onClick && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault()
        onClick()
      }
    }}
    className={cn(
      'border-border shadow-sm',
      onClick && 'cursor-pointer transition-colors hover:border-primary/40',
      className,
    )}
  >
    <CardContent className="flex items-start justify-between gap-3 p-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={cn('mt-2 text-2xl font-semibold text-foreground', valueClassName)}>
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {Icon && (
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary',
            iconClassName,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      )}
    </CardContent>
  </Card>
)

export default StatCard

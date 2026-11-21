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
}

const StatCard = ({
  title,
  value,
  hint,
  icon: Icon,
  className,
  valueClassName,
}: StatCardProps) => (
  <Card className={cn('border-border shadow-sm', className)}>
    <CardContent className="flex items-start justify-between gap-3 p-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={cn('mt-2 text-2xl font-semibold text-foreground', valueClassName)}>
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-primary dark:bg-blue-950/40">
          <Icon className="h-5 w-5" />
        </div>
      )}
    </CardContent>
  </Card>
)

export default StatCard

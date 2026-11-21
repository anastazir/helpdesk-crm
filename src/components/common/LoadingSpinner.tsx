import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  label?: string
}

const LoadingSpinner = ({ className, label }: LoadingSpinnerProps) => {
  const { t } = useTranslation()

  return (
    <div className={cn('flex min-h-48 flex-col items-center justify-center gap-3', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label ?? t('common.loading')}</p>
    </div>
  )
}

export default LoadingSpinner

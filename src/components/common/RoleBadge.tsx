import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/auth.types'

const ROLE_CLASSES: Record<UserRole, string> = {
  admin: 'border-transparent bg-violet-100 text-violet-700',
  helpdesk: 'border-transparent bg-blue-100 text-blue-700',
  engineer: 'border-transparent bg-slate-100 text-slate-700',
}

interface RoleBadgeProps {
  role: UserRole
  className?: string
}

const RoleBadge = ({ role, className }: RoleBadgeProps) => {
  const { t } = useTranslation()

  return (
    <Badge className={cn('rounded font-medium', ROLE_CLASSES[role], className)}>
      {t(`roles.${role}`)}
    </Badge>
  )
}

export default RoleBadge

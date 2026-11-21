import { cn } from '@/lib/utils'
import { getAvatarColor, getInitials } from '@/utils/formatters'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface UserAvatarProps {
  id: number
  fullName: string
  className?: string
}

const UserAvatar = ({ id, fullName, className }: UserAvatarProps) => (
  <Avatar className={cn('h-9 w-9', className)}>
    <AvatarFallback
      className={cn(
        'text-xs font-semibold text-white',
        getAvatarColor(id),
      )}
    >
      {getInitials(fullName)}
    </AvatarFallback>
  </Avatar>
)

export default UserAvatar

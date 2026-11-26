import {
  Bot,
  ClipboardCheck,
  ClipboardList,
  Download,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

import RoleBadge from '@/components/common/RoleBadge'
import UserAvatar from '@/components/common/UserAvatar'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useAppSelector } from '@/store/hooks'
import type { UserRole } from '@/types/auth.types'

interface NavItem {
  to: string
  labelKey: string
  icon: LucideIcon
}

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  admin: [
    { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    { to: '/complaints', labelKey: 'nav.complaints', icon: ClipboardList },
    { to: '/users', labelKey: 'nav.users', icon: Users },
    { to: '/zones', labelKey: 'nav.zones', icon: MapPin },
    { to: '/export', labelKey: 'nav.export', icon: Download },
    { to: '/ai-logs', labelKey: 'nav.aiLogs', icon: Bot },
    { to: '/settings', labelKey: 'nav.settings', icon: Settings },
  ],
  supervisor: [
    { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    { to: '/complaints', labelKey: 'nav.complaints', icon: ClipboardList },
    { to: '/export', labelKey: 'nav.export', icon: Download },
    { to: '/settings', labelKey: 'nav.settings', icon: Settings },
  ],
  helpdesk: [
    { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    { to: '/complaints', labelKey: 'nav.complaints', icon: ClipboardList },
    { to: '/export', labelKey: 'nav.export', icon: Download },
    { to: '/settings', labelKey: 'nav.settings', icon: Settings },
  ],
  engineer: [
    { to: '/engineer/complaints', labelKey: 'nav.myComplaints', icon: ClipboardCheck },
    { to: '/engineer/all', labelKey: 'nav.allComplaints', icon: ListChecks },
    { to: '/settings', labelKey: 'nav.settings', icon: Settings },
  ],
}

interface SidebarContentProps {
  onNavigate?: () => void
  collapsed?: boolean
}

export const SidebarContent = ({
  onNavigate,
  collapsed = false,
}: SidebarContentProps) => {
  const { t } = useTranslation()
  const { user } = useAuth()

  if (!user) return null

  const navItems = NAV_BY_ROLE[user.role]

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-sidebar text-slate-300">
      <div
        className={cn(
          'flex h-16 items-center border-b border-slate-800',
          collapsed ? 'justify-center px-2' : 'gap-3 px-4',
        )}
      >
        <img
          src="/brand-logo.png"
          alt={t('app.name')}
          className="h-9 w-9 shrink-0 rounded object-cover ring-1 ring-slate-700"
        />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{t('app.name')}</p>
            <p className="truncate text-xs text-slate-400">{t('disclaimer.internal')}</p>
          </div>
        )}
      </div>

      <nav className={cn('flex-1 space-y-1', collapsed ? 'p-2' : 'p-3')}>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              aria-label={t(item.labelKey)}
              title={collapsed ? t(item.labelKey) : undefined}
              className={({ isActive }) =>
                cn(
                  'flex w-full items-center rounded-lg text-sm font-medium transition-colors',
                  collapsed ? 'h-10 justify-center px-0' : 'h-10 gap-3 px-3',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{t(item.labelKey)}</span>}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <div
          className={cn(
            'flex items-center rounded-lg',
            collapsed ? 'justify-center px-0 py-2' : 'gap-3 px-2 py-2',
          )}
        >
          <UserAvatar id={user.id} fullName={user.full_name} />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.full_name}</p>
              <RoleBadge role={user.role} className="mt-1" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const Sidebar = () => {
  const collapsed = useAppSelector((state) => state.ui.sidebarCollapsed)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 hidden h-screen flex-col overflow-y-auto transition-[width] duration-200 md:flex',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <SidebarContent collapsed={collapsed} />
    </aside>
  )
}

export default Sidebar

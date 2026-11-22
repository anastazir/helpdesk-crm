import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, Settings, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'

import RoleBadge from '@/components/common/RoleBadge'
import UserAvatar from '@/components/common/UserAvatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { useLogout } from '@/hooks/useLogout'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setLanguage } from '@/store/slices/preferencesSlice'
import { toggleSidebar, toggleSidebarCollapsed, setAiChatOpen } from '@/store/slices/uiSlice'
import type { LanguagePreference } from '@/store/slices/preferencesSlice'

const Header = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const aiEnabled = useAppSelector((state) => state.assistant.aiEnabled)
  const { logout, loggingOut } = useLogout()
  const dispatch = useAppDispatch()
  const language = useAppSelector((state) => state.preferences.language)
  const collapsed = useAppSelector((state) => state.ui.sidebarCollapsed)
  const location = useLocation()

  const switchLanguage = (next: LanguagePreference) => {
    if (next !== language) dispatch(setLanguage(next))
  }

  const getBreadcrumb = () => {
    const path = location.pathname

    if (path.startsWith('/complaints/new')) {
      return (
        <>
          <Link to="/complaints" className="hover:text-foreground">
            {t('nav.complaints')}
          </Link>
          <span className="mx-2 text-slate-400">/</span>
          <span className="font-medium text-foreground">{t('complaint.newComplaint')}</span>
        </>
      )
    }

    if (path.startsWith('/complaints/')) {
      const id = path.split('/')[2]
      return (
        <>
          <Link to="/complaints" className="hover:text-foreground">
            {t('nav.complaints')}
          </Link>
          <span className="mx-2 text-slate-400">/</span>
          <span className="font-medium text-foreground">
            {t('common.complaintNumber', { id })}
          </span>
        </>
      )
    }

    if (path.startsWith('/engineer/complaints/')) {
      const id = path.split('/')[3]
      return (
        <>
          <Link to="/engineer/complaints" className="hover:text-foreground">
            {t('nav.myComplaints')}
          </Link>
          <span className="mx-2 text-slate-400">/</span>
          <span className="font-medium text-foreground">
            {t('common.complaintNumber', { id })}
          </span>
        </>
      )
    }

    const pages: Record<string, string> = {
      '/dashboard': 'nav.dashboard',
      '/complaints': 'nav.complaints',
      '/users': 'nav.users',
      '/zones': 'nav.zones',
      '/export': 'nav.export',
      '/ai-logs': 'nav.aiLogs',
      '/settings': 'nav.settings',
      '/engineer/complaints': 'nav.myComplaints',
      '/engineer/all': 'nav.allComplaints',
    }

    return (
      <span className="font-medium text-foreground">
        {t(pages[path] ?? 'nav.dashboard')}
      </span>
    )
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-border bg-white px-4 dark:border-slate-800 dark:bg-slate-900 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="hidden md:inline-flex"
          aria-label={
            collapsed ? t('header.expandSidebar') : t('header.collapseSidebar')
          }
          onClick={() => dispatch(toggleSidebarCollapsed())}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={t('header.openMenu')}
          onClick={() => dispatch(toggleSidebar())}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="truncate text-sm text-muted-foreground">{getBreadcrumb()}</div>
      </div>

      <div className="flex items-center gap-2">
        {aiEnabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden md:inline-flex"
            onClick={() => dispatch(setAiChatOpen(true))}
          >
            <Sparkles className="h-4 w-4" />
            {t('ai.chat.open')}
          </Button>
        )}
        <div className="flex items-center rounded-lg border border-border bg-muted p-0.5">
          <button
            type="button"
            onClick={() => switchLanguage('en')}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              language === 'en'
                ? 'bg-white text-foreground shadow-sm dark:bg-slate-800'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('language.enShort')}
          </button>
          <button
            type="button"
            onClick={() => switchLanguage('hi')}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              language === 'hi'
                ? 'bg-white text-foreground shadow-sm dark:bg-slate-800'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('language.hiShort')}
          </button>
        </div>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 gap-2 px-2"
                aria-label={t('header.userMenu')}
              >
                <UserAvatar id={user.id} fullName={user.full_name} className="h-8 w-8" />
                <div className="hidden text-left sm:block">
                  <p className="max-w-36 truncate text-sm font-medium">{user.full_name}</p>
                  <p className="max-w-36 truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="flex items-center gap-3">
                <UserAvatar id={user.id} fullName={user.full_name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.full_name}</p>
                  <p className="truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </p>
                  <RoleBadge role={user.role} className="mt-1" />
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  {t('header.settings')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600"
                disabled={loggingOut}
                onSelect={() => {
                  void logout()
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('header.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}

export default Header

import { Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'
import AiChatDrawer from '@/components/assistant/AiChatDrawer'
import { useAppSelector } from '@/store/hooks'

import Header from './Header'
import MobileDrawer from './MobileDrawer'
import Sidebar from './Sidebar'

const AppShell = () => {
  const collapsed = useAppSelector((state) => state.ui.sidebarCollapsed)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileDrawer />
      <div
        className={cn(
          'flex flex-1 flex-col overflow-hidden transition-[margin] duration-200',
          collapsed ? 'md:ml-16' : 'md:ml-60',
        )}
      >
        <Header />
        <main className="flex-1 overflow-y-auto bg-canvas p-4 dark:bg-slate-950 md:p-6">
          <Outlet />
        </main>
      </div>
      <AiChatDrawer />
    </div>
  )
}

export default AppShell

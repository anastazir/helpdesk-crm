import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

import { assistantSettingsApi } from '@/api/ai.api'
import { cn } from '@/lib/utils'
import AiChatDrawer from '@/components/assistant/AiChatDrawer'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setAssistantSettings } from '@/store/slices/assistantSlice'
import { logger } from '@/utils/logger'

import Header from './Header'
import MobileDrawer from './MobileDrawer'
import Sidebar from './Sidebar'

const AppShell = () => {
  const dispatch = useAppDispatch()
  const collapsed = useAppSelector((state) => state.ui.sidebarCollapsed)
  const aiEnabled = useAppSelector((state) => state.assistant.aiEnabled)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await assistantSettingsApi.get()
        if (response.success && response.data) {
          dispatch(
            setAssistantSettings({
              aiEnabled: response.data.ai_enabled,
              loaded: true,
              canManage: response.data.can_manage,
            }),
          )
        } else {
          dispatch(
            setAssistantSettings({ aiEnabled: true, loaded: true }),
          )
        }
      } catch (error) {
        logger.error('[AI SETTINGS] Failed to load.', error)
        dispatch(
          setAssistantSettings({ aiEnabled: true, loaded: true }),
        )
      }
    }
    void loadSettings()
  }, [dispatch])

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
      {aiEnabled && <AiChatDrawer />}
    </div>
  )
}

export default AppShell

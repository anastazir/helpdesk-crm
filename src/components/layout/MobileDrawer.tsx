import { useTranslation } from 'react-i18next'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setSidebarOpen } from '@/store/slices/uiSlice'

import { SidebarContent } from './Sidebar'

const MobileDrawer = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen)

  return (
    <Sheet open={sidebarOpen} onOpenChange={(open) => dispatch(setSidebarOpen(open))}>
      <SheetContent side="left" className="w-64 border-0 bg-sidebar p-0">
        <SheetTitle className="sr-only">{t('app.name')}</SheetTitle>
        <SheetDescription className="sr-only">{t('app.tagline')}</SheetDescription>
        <SidebarContent onNavigate={() => dispatch(setSidebarOpen(false))} />
      </SheetContent>
    </Sheet>
  )
}

export default MobileDrawer

import { Outlet } from 'react-router-dom'

import Header from './Header'
import MobileDrawer from './MobileDrawer'
import Sidebar from './Sidebar'

const AppShell = () => (
  <div className="flex h-screen overflow-hidden">
    <Sidebar />
    <MobileDrawer />
    <div className="flex flex-1 flex-col overflow-hidden md:ml-60">
      <Header />
      <main className="flex-1 overflow-y-auto bg-canvas p-4 dark:bg-slate-950 md:p-6">
        <Outlet />
      </main>
    </div>
  </div>
)

export default AppShell

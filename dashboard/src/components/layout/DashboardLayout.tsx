import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import styles from './DashboardLayout.module.scss'

const pageTitles: Record<string, string> = {
  '/campaigns': 'Campaigns',
  '/leads': 'Leads',
  '/posts': 'Posts',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
}

export function DashboardLayout() {
  const location = useLocation()

  // Match base path for title (e.g. /campaigns/:id → "Campaigns")
  const basePath = '/' + (location.pathname.split('/')[1] ?? '')
  const title = pageTitles[basePath] ?? 'Dashboard'

  return (
    <div className={styles.layout}>
      <Sidebar />
      <TopBar title={title} />
      <main className={styles.main}>
        <AnimatePresence mode="wait">
          <motion.div
            key={basePath}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

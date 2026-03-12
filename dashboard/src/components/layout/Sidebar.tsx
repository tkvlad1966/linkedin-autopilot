import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart2,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useExtensionStore } from '../../store/extensionStore'
import styles from './Sidebar.module.scss'

const navItems = [
  { to: '/campaigns', label: 'Campaigns', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/posts', label: 'Posts', icon: FileText },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const

export function Sidebar() {
  const profile = useAuthStore((s) => s.profile)
  const logout = useAuthStore((s) => s.logout)
  const isConnected = useExtensionStore((s) => s.isConnected)

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?'

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Zap size={18} />
        </div>
        <span>LinkedIn Autopilot</span>
      </div>

      <nav className={styles.nav}>
        <div className={styles.sectionLabel}>Main</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <item.icon className={styles.navIcon} size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.bottom}>
        <div className={styles.extensionStatus}>
          <span
            className={`${styles.statusDot} ${
              isConnected ? styles.connected : styles.disconnected
            }`}
          />
          {isConnected ? 'Extension Active' : 'Not Connected'}
        </div>

        <div className={styles.userSection}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>
              {profile?.full_name ?? 'User'}
            </div>
            <div className={styles.userPlan}>{profile?.plan ?? 'free'}</div>
          </div>
          <button
            className={styles.logoutBtn}
            onClick={logout}
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}

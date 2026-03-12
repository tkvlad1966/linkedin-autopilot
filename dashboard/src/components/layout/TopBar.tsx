import { Bell } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useExtensionStore } from '../../store/extensionStore'
import styles from './TopBar.module.scss'

interface TopBarProps {
  title: string
}

export function TopBar({ title }: TopBarProps) {
  const profile = useAuthStore((s) => s.profile)
  const todayCount = useExtensionStore((s) => s.todayCount)

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?'

  return (
    <header className={styles.topBar}>
      <h1 className={styles.title}>{title}</h1>

      <div className={styles.right}>
        <span className={styles.stats}>
          Today: <span className={styles.statValue}>{todayCount}</span> sent
        </span>

        <button className={styles.iconButton} aria-label="Notifications">
          <Bell size={20} />
        </button>

        <button className={styles.avatarButton} aria-label="User menu">
          {initials}
        </button>
      </div>
    </header>
  )
}

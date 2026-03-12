import type { ReactNode } from 'react'
import styles from './Badge.module.scss'

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'
type Size = 'sm' | 'md'

interface BadgeProps {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

export function Badge({ variant = 'neutral', size = 'md', className, children }: BadgeProps) {
  const cls = [styles.badge, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ')

  return <span className={cls}>{children}</span>
}

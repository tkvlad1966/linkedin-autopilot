import { createContext, useCallback, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import styles from './Toast.module.scss'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  variant: ToastVariant
  message: string
}

interface ToastApi {
  success(message: string): void
  error(message: string): void
  info(message: string): void
}

export const ToastContext = createContext<ToastApi | null>(null)

let nextId = 0

const icons: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle size={20} />,
  error: <XCircle size={20} />,
  info: <Info size={20} />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = ++nextId
      setToasts((prev) => [...prev, { id, variant, message }])
      setTimeout(() => dismiss(id), 4000)
    },
    [dismiss],
  )

  const api: ToastApi = {
    success: (msg) => push('success', msg),
    error: (msg) => push('error', msg),
    info: (msg) => push('info', msg),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.container}>
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className={`${styles.toast} ${styles[t.variant]}`}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ duration: 0.2 }}
            >
              <span className={styles.icon}>{icons[t.variant]}</span>
              <span className={styles.message}>{t.message}</span>
              <button
                className={styles.close}
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

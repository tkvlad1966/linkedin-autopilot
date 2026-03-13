import { useState } from 'react'
import { useExtensionState } from './hooks/useExtensionState'
import styles from './Popup.module.scss'

// ── Onboarding (not connected) ─────────────────────────────

function OnboardingScreen({
  onConnect,
  error,
  isConnecting,
}: {
  onConnect: (token: string) => void
  error: string | null
  isConnecting: boolean
}) {
  const [token, setToken] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = token.trim()
    if (trimmed) onConnect(trimmed)
  }

  return (
    <div className={styles.onboarding}>
      <div className={styles.onboardingHeader}>
        <div className={styles.logoIcon}>LA</div>
        <span className={styles.logoText}>LinkedIn Autopilot</span>
      </div>

      <div className={styles.onboardingBody}>
        <div className={styles.lockIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>

        <h2 className={styles.onboardingTitle}>Connect to your account</h2>
        <p className={styles.onboardingDesc}>
          Copy your Connection Token from the Dashboard Settings page
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            className={styles.tokenInput}
            rows={3}
            placeholder="Paste your connection token here..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            spellCheck={false}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button
            type="submit"
            className={styles.connectBtn}
            disabled={!token.trim() || isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Connected state ─────────────────────────────────────────

function ConnectedScreen({
  state,
}: {
  state: ReturnType<typeof useExtensionState>
}) {
  const {
    isPaused, todayCount, dailyLimit,
    currentTask, workingHours, togglePause, disconnect,
  } = state

  const progressPct = dailyLimit > 0 ? Math.min((todayCount / dailyLimit) * 100, 100) : 0

  function handleOpenDashboard() {
    chrome.storage.sync.get('dashboardUrl', ({ dashboardUrl }) => {
      chrome.tabs.create({ url: dashboardUrl || 'http://localhost:5173' })
    })
  }

  return (
    <div className={styles.connected}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerLogo}>LA</div>
          <span className={styles.headerTitle}>LinkedIn Autopilot</span>
        </div>
      </div>

      {/* Status */}
      <div className={styles.body}>
        <div className={styles.statusCard}>
          <div className={styles.statusRow}>
            <div className={`${styles.statusDot} ${isPaused ? styles.paused : styles.active}`} />
            <span className={`${styles.statusText} ${isPaused ? styles.paused : styles.active}`}>
              {isPaused ? 'PAUSED' : 'ACTIVE'}
            </span>
          </div>
          <p className={styles.taskText}>
            {currentTask
              ? currentTask
              : isPaused
                ? 'Automation paused'
                : 'Idle · Waiting for next task'}
          </p>
        </div>

        {/* Today's stats */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{todayCount}</span>
            <span className={styles.statLabel}>Actions</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{dailyLimit}</span>
            <span className={styles.statLabel}>Daily Limit</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{dailyLimit - todayCount}</span>
            <span className={styles.statLabel}>Remaining</span>
          </div>
        </div>

        {/* Working hours */}
        <div className={styles.infoRow}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Active {workingHours}</span>
        </div>

        {/* Daily limit progress */}
        <div className={styles.progressSection}>
          <div className={styles.progressLabel}>
            {todayCount} / {dailyLimit} actions today
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressBar}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Toggle button */}
        <button
          type="button"
          className={`${styles.toggleBtn} ${isPaused ? styles.resumeBtn : styles.pauseBtn}`}
          onClick={togglePause}
        >
          {isPaused ? '▶ Resume Automation' : '⏸ Pause Automation'}
        </button>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <button type="button" className={styles.footerLink} onClick={handleOpenDashboard}>
          Open Dashboard ↗
        </button>
        <div className={styles.footerDivider} />
        <button type="button" className={styles.footerLink} onClick={disconnect}>
          Disconnect
        </button>
      </div>
    </div>
  )
}

// ── Root ────────────────────────────────────────────────────

export function Popup() {
  const state = useExtensionState()

  if (!state.isConnected) {
    return (
      <OnboardingScreen
        onConnect={state.connect}
        error={state.error}
        isConnecting={state.isConnecting}
      />
    )
  }

  return <ConnectedScreen state={state} />
}

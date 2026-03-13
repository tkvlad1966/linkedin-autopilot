import { useState, useEffect, useCallback } from 'react'
import {
  Copy, Check, RefreshCw, Shield, Clock, User,
  AlertTriangle, Zap, Trash2,
} from 'lucide-react'
import { useExtensionStore } from '../store/extensionStore'
import {
  useProfile,
  useUpdateProfile,
  useRegenerateToken,
  usePauseAllCampaigns,
  useClearQueue,
} from '../hooks/useSettings'
import styles from './Settings.module.scss'

// ── Timezones ────────────────────────────────────────────────

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Sao_Paulo', 'Europe/London', 'Europe/Berlin', 'Europe/Lisbon',
  'Europe/Moscow', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Shanghai',
  'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland',
]

export function Settings() {
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const regenerateToken = useRegenerateToken()
  const pauseAll = usePauseAllCampaigns()
  const clearQueue = useClearQueue()
  const extensionConnected = useExtensionStore((s) => s.isConnected)

  // ── Local form state ──────────────────────────────────────

  const [dailyLimit, setDailyLimit] = useState(20)
  const [minDelay, setMinDelay] = useState(30)
  const [maxDelay, setMaxDelay] = useState(120)
  const [workStart, setWorkStart] = useState('09:00')
  const [workEnd, setWorkEnd] = useState('18:00')
  const [timezone, setTimezone] = useState('Europe/Lisbon')
  const [copied, setCopied] = useState(false)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)

  // Sync form state from profile
  useEffect(() => {
    if (!profile) return
    setDailyLimit(profile.daily_limit)
    setWorkStart(profile.working_hours_start)
    setWorkEnd(profile.working_hours_end)
    setTimezone(profile.timezone)
  }, [profile])

  // ── Handlers ──────────────────────────────────────────────

  const handleCopyToken = useCallback(async () => {
    if (!profile?.extension_token) return
    await navigator.clipboard.writeText(profile.extension_token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [profile])

  function handleSaveSettings() {
    // Validate min < max delay
    if (minDelay >= maxDelay) return

    updateProfile.mutate({
      daily_limit: dailyLimit,
      working_hours_start: workStart,
      working_hours_end: workEnd,
      timezone,
    })
  }

  function handleDangerAction(action: string) {
    if (confirmAction === action) {
      // Already confirmed — execute
      if (action === 'pause') pauseAll.mutate()
      if (action === 'clear') clearQueue.mutate()
      setConfirmAction(null)
    } else {
      setConfirmAction(action)
      setTimeout(() => setConfirmAction(null), 3000)
    }
  }

  if (isLoading) {
    return <div className={styles.loading}>Loading settings...</div>
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Settings</h1>

      {/* ── Section 1: Extension Setup ─────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Shield size={18} />
          <h2 className={styles.sectionTitle}>Extension Setup</h2>
        </div>

        {extensionConnected ? (
          <div className={styles.successBanner}>
            <Check size={16} />
            <span>Extension connected</span>
          </div>
        ) : (
          <>
            <div className={styles.warningBanner}>
              <AlertTriangle size={16} />
              <span>Extension not connected</span>
            </div>

            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNumber}>1</span>
                <span>Download &amp; install the Chrome Extension</span>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>2</span>
                <span>Open the extension popup in Chrome</span>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>3</span>
                <span>Paste your Connection Token (shown below) into the extension</span>
              </div>
            </div>
          </>
        )}

        <div className={styles.tokenSection}>
          <label className={styles.fieldLabel}>Connection Token</label>
          <div className={styles.tokenRow}>
            <input
              type="text"
              readOnly
              className={styles.tokenInput}
              value={profile?.extension_token ?? ''}
            />
            <button
              type="button"
              className={styles.copyBtn}
              onClick={handleCopyToken}
            >
              {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
          <p className={styles.tokenNote}>
            This token links the extension to your account. Keep it private.
          </p>
          <button
            type="button"
            className={styles.regenerateBtn}
            onClick={() => regenerateToken.mutate()}
            disabled={regenerateToken.isPending}
          >
            <RefreshCw size={14} />
            {regenerateToken.isPending ? 'Regenerating...' : 'Regenerate Token'}
          </button>
        </div>
      </div>

      {/* ── Section 2: Automation Limits ───────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Zap size={18} />
          <h2 className={styles.sectionTitle}>Automation Limits</h2>
        </div>

        <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Daily action limit
              <span className={styles.valueChip}>{dailyLimit}</span>
            </label>
            <input
              type="range"
              min={5}
              max={100}
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
              className={styles.slider}
            />
            <div className={styles.sliderLabels}>
              <span>5</span>
              <span>100</span>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Min delay between actions (sec)
              <span className={styles.valueChip}>{minDelay}s</span>
            </label>
            <input
              type="range"
              min={10}
              max={120}
              value={minDelay}
              onChange={(e) => setMinDelay(Number(e.target.value))}
              className={styles.slider}
            />
            <div className={styles.sliderLabels}>
              <span>10s</span>
              <span>120s</span>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Max delay between actions (sec)
              <span className={styles.valueChip}>{maxDelay}s</span>
            </label>
            <input
              type="range"
              min={30}
              max={300}
              value={maxDelay}
              onChange={(e) => setMaxDelay(Number(e.target.value))}
              className={styles.slider}
            />
            <div className={styles.sliderLabels}>
              <span>30s</span>
              <span>300s</span>
            </div>
            {minDelay >= maxDelay && (
              <p className={styles.validationError}>
                Min delay must be less than max delay
              </p>
            )}
          </div>

          <div className={styles.timeRow}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Working hours start</label>
              <input
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                className={styles.timeInput}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Working hours end</label>
              <input
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                className={styles.timeInput}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className={styles.select}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          className={styles.saveBtn}
          onClick={handleSaveSettings}
          disabled={updateProfile.isPending || minDelay >= maxDelay}
        >
          {updateProfile.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* ── Section 3: Account ─────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <User size={18} />
          <h2 className={styles.sectionTitle}>Account</h2>
        </div>

        <div className={styles.accountInfo}>
          <div className={styles.accountRow}>
            <span className={styles.accountLabel}>Email</span>
            <span className={styles.accountValue}>{profile?.email}</span>
          </div>
          <div className={styles.accountRow}>
            <span className={styles.accountLabel}>Plan</span>
            <span className={`${styles.planBadge} ${styles[`plan_${profile?.plan}`]}`}>
              {profile?.plan?.toUpperCase()}
            </span>
          </div>
        </div>

        {profile?.plan === 'free' && (
          <div className={styles.upgradeCard}>
            <h3 className={styles.upgradeTitle}>Upgrade to Pro</h3>
            <ul className={styles.upgradeList}>
              <li>Unlimited daily actions</li>
              <li>Advanced analytics</li>
              <li>Priority support</li>
              <li>Custom working hours</li>
            </ul>
            <button type="button" className={styles.upgradeBtn}>
              Upgrade Now
            </button>
          </div>
        )}
      </div>

      {/* ── Section 4: Danger Zone ─────────────────────────── */}
      <div className={`${styles.section} ${styles.dangerSection}`}>
        <div className={styles.sectionHeader}>
          <AlertTriangle size={18} />
          <h2 className={styles.sectionTitle}>Danger Zone</h2>
        </div>

        <div className={styles.dangerActions}>
          <div className={styles.dangerRow}>
            <div>
              <p className={styles.dangerLabel}>Pause all active campaigns</p>
              <p className={styles.dangerDesc}>This will pause every running campaign</p>
            </div>
            <button
              type="button"
              className={styles.dangerBtn}
              onClick={() => handleDangerAction('pause')}
              disabled={pauseAll.isPending}
            >
              <Clock size={14} />
              {confirmAction === 'pause' ? 'Click again to confirm' : 'Pause All'}
            </button>
          </div>

          <div className={styles.dangerRow}>
            <div>
              <p className={styles.dangerLabel}>Clear pending queue</p>
              <p className={styles.dangerDesc}>Skip all pending actions in the queue</p>
            </div>
            <button
              type="button"
              className={styles.dangerBtn}
              onClick={() => handleDangerAction('clear')}
              disabled={clearQueue.isPending}
            >
              <Trash2 size={14} />
              {confirmAction === 'clear' ? 'Click again to confirm' : 'Clear Queue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

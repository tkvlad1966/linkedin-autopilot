import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import styles from './Login.module.scss'

const features = [
  'Automated connection requests & follow-ups',
  'Smart scheduling within LinkedIn safety limits',
  'Real-time analytics and campaign tracking',
]

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'password' | 'magic'>('password')

  async function handlePasswordLogin(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  async function handleMagicLink() {
    if (!email) {
      setError('Enter your email first')
      return
    }
    setError('')
    setLoading(true)

    const { error: err } = await supabase.auth.signInWithOtp({ email })

    if (err) {
      setError(err.message)
    } else {
      setError('')
      setMode('magic')
    }
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroIllustration}>
            <Zap size={80} />
          </div>
          <h1 className={styles.heroTagline}>
            Grow your LinkedIn network on autopilot
          </h1>
          <ul className={styles.heroBullets}>
            {features.map((f) => (
              <li key={f} className={styles.bullet}>
                <span className={styles.bulletIcon}>
                  <Check size={14} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.formPanel}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardLogo}>
              <Zap size={22} />
            </div>
            <h2 className={styles.cardTitle}>LinkedIn Autopilot</h2>
          </div>

          {mode === 'magic' ? (
            <div>
              <p style={{ marginBottom: 16, color: 'var(--color-text-secondary)', fontSize: 14 }}>
                Check your email for the magic link. Click it to sign in.
              </p>
              <Button variant="secondary" fullWidth onClick={() => setMode('password')}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <form className={styles.form} onSubmit={handlePasswordLogin}>
                {error && <div className={styles.errorMsg}>{error}</div>}

                <Input
                  label="Email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />

                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>

              <div className={styles.divider}>or</div>

              <button
                className={styles.magicLink}
                onClick={handleMagicLink}
                disabled={loading}
                style={{ width: '100%' }}
              >
                Send magic link
              </button>

              <p className={styles.footer}>
                Don't have an account? <Link to="/auth/signup">Sign up</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

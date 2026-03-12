import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
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

export function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
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

          {success ? (
            <div>
              <p style={{ marginBottom: 16, color: 'var(--color-text-secondary)', fontSize: 14 }}>
                Check your email to confirm your account, then sign in.
              </p>
              <Link to="/auth/login">
                <Button variant="secondary" fullWidth>
                  Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <form className={styles.form} onSubmit={handleSignup}>
                {error && <div className={styles.errorMsg}>{error}</div>}

                <Input
                  label="Full name"
                  type="text"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                />

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
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />

                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign up'}
                </Button>
              </form>

              <p className={styles.footer}>
                Already have an account? <Link to="/auth/login">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

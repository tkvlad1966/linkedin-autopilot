import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCreateCampaign } from '../../hooks/useCampaigns'
import { useToast } from '../../hooks/useToast'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import styles from './NewCampaignModal.module.scss'

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Lisbon',
  'Europe/Kyiv',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
]

interface Props {
  onClose(): void
}

export function NewCampaignModal({ onClose }: Props) {
  const navigate = useNavigate()
  const createCampaign = useCreateCampaign()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [dailyLimit, setDailyLimit] = useState(25)
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('18:00')
  const [timezone, setTimezone] = useState('Europe/Kyiv')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    try {
      const campaign = await createCampaign.mutateAsync({
        name,
        status: 'draft',
        daily_limit: dailyLimit,
        working_hours_start: start,
        working_hours_end: end,
        timezone,
      })
      toast.success('Campaign created')
      onClose()
      navigate(`/campaigns/${campaign.id}`)
    } catch {
      toast.error('Failed to create campaign')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <motion.div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
      >
        <h2 className={styles.heading}>New Campaign</h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="Campaign name"
            placeholder="e.g. Q1 SaaS Founders"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <div className={styles.sliderGroup}>
            <label className={styles.sliderLabel}>
              Daily limit
              <span className={styles.sliderValue}>{dailyLimit}</span>
            </label>
            <input
              type="range"
              className={styles.slider}
              min={5}
              max={100}
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
            />
          </div>

          <div className={styles.timeRow}>
            <div className={styles.timeField}>
              <label className={styles.timeLabel}>Start</label>
              <input
                type="time"
                className={styles.timeInput}
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className={styles.timeField}>
              <label className={styles.timeLabel}>End</label>
              <input
                type="time"
                className={styles.timeInput}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.selectGroup}>
            <label className={styles.timeLabel}>Timezone</label>
            <select
              className={styles.select}
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.footer}>
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCampaign.isPending}>
              {createCampaign.isPending ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Rocket, Pause, Play } from 'lucide-react'
import { useCampaigns, useUpdateCampaign } from '../hooks/useCampaigns'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { NewCampaignModal } from '../components/campaigns/NewCampaignModal'
import type { Campaign, CampaignStatus } from '@shared/types'
import styles from './Campaigns.module.scss'

const statusVariant: Record<CampaignStatus, 'info' | 'success' | 'warning' | 'neutral'> = {
  draft: 'neutral',
  active: 'success',
  paused: 'warning',
  completed: 'info',
}

export function Campaigns() {
  const { data: campaigns = [], isLoading } = useCampaigns()
  const updateCampaign = useUpdateCampaign()
  const [showNew, setShowNew] = useState(false)

  const counts = {
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === 'active').length,
    paused: campaigns.filter((c) => c.status === 'paused').length,
    completed: campaigns.filter((c) => c.status === 'completed').length,
  }

  function toggleStatus(c: Campaign) {
    const next = c.status === 'active' ? 'paused' : 'active'
    updateCampaign.mutate({ id: c.id, status: next })
  }

  if (isLoading) {
    return <p>Loading campaigns...</p>
  }

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Campaigns</h1>
        <Button onClick={() => setShowNew(true)}>New Campaign</Button>
      </div>

      <div className={styles.stats}>
        {(['total', 'active', 'paused', 'completed'] as const).map((key) => (
          <div key={key} className={styles.statPill}>
            <span className={styles.statCount}>{counts[key]}</span>
            {key}
          </div>
        ))}
      </div>

      {campaigns.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <Rocket size={48} />
          </div>
          <h3 className={styles.emptyTitle}>No campaigns yet</h3>
          <p className={styles.emptyText}>
            Create your first campaign to start automating outreach.
          </p>
          <Button onClick={() => setShowNew(true)}>Create your first campaign</Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {campaigns.map((c, i) => {
            const progress = c.total_leads > 0 ? (c.leads_messaged / c.total_leads) * 100 : 0
            const replyRate =
              c.leads_messaged > 0 ? Math.round((c.leads_replied / c.leads_messaged) * 100) : 0

            return (
              <motion.div
                key={c.id}
                className={styles.card}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
              >
                <div className={styles.cardTop}>
                  <span className={styles.cardName}>{c.name}</span>
                  <Badge variant={statusVariant[c.status]} size="sm">
                    {c.status}
                  </Badge>
                </div>

                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className={styles.cardStats}>
                  {c.leads_messaged} sent &middot; {c.leads_replied} replied &middot;{' '}
                  {replyRate}% reply rate
                </div>

                <div className={styles.cardHours}>
                  {c.working_hours_start} – {c.working_hours_end} {c.timezone}
                </div>

                <div className={styles.cardFooter}>
                  <Link to={`/campaigns/${c.id}`} className={styles.openLink}>
                    Open &rarr;
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStatus(c)}
                    aria-label={c.status === 'active' ? 'Pause' : 'Resume'}
                  >
                    {c.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {showNew && <NewCampaignModal onClose={() => setShowNew(false)} />}
    </>
  )
}

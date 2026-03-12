import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pause, Play } from 'lucide-react'
import { useCampaign, useUpdateCampaign } from '../hooks/useCampaigns'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { SequenceBuilder } from '../components/sequence/SequenceBuilder'
import type { CampaignStatus } from '@shared/types'
import styles from './CampaignDetail.module.scss'

const statusVariant: Record<CampaignStatus, 'info' | 'success' | 'warning' | 'neutral'> = {
  draft: 'neutral',
  active: 'success',
  paused: 'warning',
  completed: 'info',
}

type Tab = 'sequence' | 'leads' | 'analytics' | 'settings'

const tabs: { key: Tab; label: string }[] = [
  { key: 'sequence', label: 'Sequence' },
  { key: 'leads', label: 'Leads' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'settings', label: 'Settings' },
]

function Placeholder({ label }: { label: string }) {
  return <p style={{ color: 'var(--color-text-muted)' }}>{label} — coming soon</p>
}

export function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: campaign, isLoading } = useCampaign(id)
  const updateCampaign = useUpdateCampaign()
  const [activeTab, setActiveTab] = useState<Tab>('sequence')
  const nameTimeout = useRef<ReturnType<typeof setTimeout>>()

  if (isLoading || !campaign) {
    return <p>Loading...</p>
  }

  function handleNameChange(value: string) {
    clearTimeout(nameTimeout.current)
    nameTimeout.current = setTimeout(() => {
      updateCampaign.mutate({ id: campaign!.id, name: value })
    }, 600)
  }

  function toggleStatus() {
    const next = campaign!.status === 'active' ? 'paused' : 'active'
    updateCampaign.mutate({ id: campaign!.id, status: next })
  }

  return (
    <>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/campaigns')}>
          <ArrowLeft size={18} />
        </button>

        <input
          className={styles.nameInput}
          defaultValue={campaign.name}
          onChange={(e) => handleNameChange(e.target.value)}
        />

        <div className={styles.actions}>
          <Badge variant={statusVariant[campaign.status]}>{campaign.status}</Badge>
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleStatus}
          >
            {campaign.status === 'active' ? (
              <><Pause size={14} /> Pause</>
            ) : (
              <><Play size={14} /> Activate</>
            )}
          </Button>
        </div>
      </div>

      <div className={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${activeTab === t.key ? styles.active : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'sequence' && <SequenceBuilder campaignId={campaign.id} />}
        {activeTab === 'leads' && <Placeholder label="Leads" />}
        {activeTab === 'analytics' && <Placeholder label="Analytics" />}
        {activeTab === 'settings' && <Placeholder label="Settings" />}
      </div>
    </>
  )
}

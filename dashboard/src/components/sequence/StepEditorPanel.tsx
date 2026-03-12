import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, UserPlus, MessageSquare, Reply, Heart, Eye } from 'lucide-react'
import type { SequenceStep, SequenceStepType } from '@shared/types'
import { useUpsertStep } from '../../hooks/useCampaigns'
import { useToast } from '../../hooks/useToast'
import { Button } from '../ui/Button'
import styles from './StepEditorPanel.module.scss'

const typeOptions: { type: SequenceStepType; label: string; icon: typeof UserPlus }[] = [
  { type: 'connect', label: 'Connect', icon: UserPlus },
  { type: 'message', label: 'Message', icon: MessageSquare },
  { type: 'followup', label: 'Follow-up', icon: Reply },
  { type: 'like', label: 'Like', icon: Heart },
  { type: 'view_profile', label: 'View', icon: Eye },
]

const tokens = [
  { label: '{{first_name}}', value: '{{first_name}}' },
  { label: '{{last_name}}', value: '{{last_name}}' },
  { label: '{{company}}', value: '{{company}}' },
  { label: '{{title}}', value: '{{title}}' },
]

const SAMPLE_DATA: Record<string, string> = {
  '{{first_name}}': 'Jane',
  '{{last_name}}': 'Smith',
  '{{company}}': 'Acme Corp',
  '{{title}}': 'Head of Growth',
}

const hasMessage = (t: SequenceStepType) =>
  t === 'connect' || t === 'message' || t === 'followup'

interface Props {
  campaignId: string
  step: Partial<SequenceStep> | null
  nextOrder: number
  onClose(): void
}

export function StepEditorPanel({ campaignId, step, nextOrder, onClose }: Props) {
  const upsertStep = useUpsertStep()
  const { toast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [type, setType] = useState<SequenceStepType>(step?.type ?? 'connect')
  const [delayDays, setDelayDays] = useState(step?.delay_days ?? 1)
  const [message, setMessage] = useState(step?.message_template ?? '')

  // Reset when step changes
  useEffect(() => {
    setType(step?.type ?? 'connect')
    setDelayDays(step?.delay_days ?? 1)
    setMessage(step?.message_template ?? '')
  }, [step])

  function insertToken(token: string) {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const next = message.slice(0, start) + token + message.slice(end)
    setMessage(next)
    // restore cursor after token
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + token.length, start + token.length)
    })
  }

  function renderPreview() {
    let text = message
    for (const [key, val] of Object.entries(SAMPLE_DATA)) {
      text = text.replaceAll(key, val)
    }
    return text || 'Your message preview will appear here...'
  }

  async function handleSave() {
    try {
      await upsertStep.mutateAsync({
        ...(step?.id ? { id: step.id } : {}),
        campaign_id: campaignId,
        type,
        delay_days: delayDays,
        step_order: step?.step_order ?? nextOrder,
        message_template: hasMessage(type) ? message : null,
      })
      toast.success(step?.id ? 'Step updated' : 'Step added')
      onClose()
    } catch {
      toast.error('Failed to save step')
    }
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <motion.div
        className={styles.panel}
        initial={{ x: 480 }}
        animate={{ x: 0 }}
        exit={{ x: 480 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>
            {step?.id ? 'Edit Step' : 'Add Step'}
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {/* Type selector */}
          <div className={styles.typeSelector}>
            {typeOptions.map((opt) => (
              <button
                key={opt.type}
                className={`${styles.typeOption} ${type === opt.type ? styles.selected : ''}`}
                onClick={() => setType(opt.type)}
                type="button"
              >
                <opt.icon size={14} />
                {opt.label}
              </button>
            ))}
          </div>

          {/* Delay */}
          <div className={styles.delayRow}>
            <span className={styles.delayLabel}>Wait</span>
            <input
              type="number"
              className={styles.delayInput}
              min={0}
              max={365}
              value={delayDays}
              onChange={(e) => setDelayDays(Number(e.target.value))}
            />
            <span className={styles.delayLabel}>days after previous step</span>
          </div>

          {/* Message editor (only for types with messages) */}
          {hasMessage(type) && (
            <div className={styles.messageSection}>
              <label className={styles.messageSectionLabel}>Message template</label>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                placeholder="Hi {{first_name}}, I noticed you work at {{company}}..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <div className={styles.tokens}>
                {tokens.map((t) => (
                  <button
                    key={t.value}
                    className={styles.tokenChip}
                    type="button"
                    onClick={() => insertToken(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className={styles.charCount}>{message.length} characters</div>

              <div className={styles.preview}>
                <div className={styles.previewLabel}>Preview</div>
                <div className={styles.previewText}>{renderPreview()}</div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={upsertStep.isPending}>
            {upsertStep.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </motion.div>
    </>
  )
}

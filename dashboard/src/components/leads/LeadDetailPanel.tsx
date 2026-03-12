import { useState, useRef, useCallback, type KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
  X,
  ExternalLink,
  UserPlus,
  MessageSquare,
  Reply,
  Heart,
  Eye,
  CheckCircle,
} from 'lucide-react'
import type { QueueAction } from '@shared/types'
import { useLead, useLeadActivity, useUpdateLead } from '../../hooks/useLeads'
import { useToast } from '../../hooks/useToast'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import styles from './LeadDetailPanel.module.scss'

const actionIcons: Record<QueueAction, typeof UserPlus> = {
  send_connection: UserPlus,
  send_message: MessageSquare,
  send_followup: Reply,
  like_post: Heart,
  view_profile: Eye,
  publish_post: MessageSquare,
}

const actionLabels: Record<QueueAction, string> = {
  send_connection: 'Connection request',
  send_message: 'Message sent',
  send_followup: 'Follow-up sent',
  like_post: 'Liked post',
  view_profile: 'Profile viewed',
  publish_post: 'Post published',
}

type Tab = 'activity' | 'messages' | 'notes'

interface Props {
  leadId: string
  onClose(): void
}

export function LeadDetailPanel({ leadId, onClose }: Props) {
  const { data: lead } = useLead(leadId)
  const { data: activity = [] } = useLeadActivity(leadId)
  const updateLead = useUpdateLead()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<Tab>('activity')
  const [tagInput, setTagInput] = useState('')
  const notesTimeout = useRef<ReturnType<typeof setTimeout>>()

  const handleNotesBlur = useCallback(
    (value: string) => {
      clearTimeout(notesTimeout.current)
      notesTimeout.current = setTimeout(() => {
        updateLead.mutate({ id: leadId, notes: value })
      }, 500)
    },
    [leadId, updateLead],
  )

  function handleAddTag(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' || !tagInput.trim() || !lead) return
    const next = [...lead.tags, tagInput.trim()]
    updateLead.mutate({ id: leadId, tags: next })
    setTagInput('')
  }

  function handleRemoveTag(tag: string) {
    if (!lead) return
    const next = lead.tags.filter((t) => t !== tag)
    updateLead.mutate({ id: leadId, tags: next })
  }

  if (!lead) return null

  const initials = ((lead.first_name?.[0] ?? '') + (lead.last_name?.[0] ?? '')).toUpperCase() || '?'
  const messages = activity.filter(
    (a) => a.action === 'send_message' || a.action === 'send_followup',
  )

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <motion.div
        className={styles.panel}
        initial={{ x: 560 }}
        animate={{ x: 0 }}
        exit={{ x: 560 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.avatar}>
            {lead.avatar_url ? <img src={lead.avatar_url} alt="" /> : initials}
          </div>
          <div className={styles.headerInfo}>
            <div className={styles.headerName}>
              {lead.first_name} {lead.last_name}
            </div>
            {lead.title && <div className={styles.headerTitle}>{lead.title}</div>}
            {lead.company && <div className={styles.headerCompany}>{lead.company}</div>}
            <a
              href={lead.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.linkedinLink}
            >
              View on LinkedIn <ExternalLink size={11} />
            </a>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {(['activity', 'messages', 'notes'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`${styles.tab} ${activeTab === t ? styles.active : ''}`}
              onClick={() => setActiveTab(t)}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className={styles.body}>
          {activeTab === 'activity' && (
            <div className={styles.timeline}>
              {activity.length === 0 ? (
                <p className={styles.emptyTab}>No activity yet</p>
              ) : (
                activity.map((item) => {
                  const Icon = actionIcons[item.action] ?? CheckCircle
                  return (
                    <div key={item.id} className={styles.timelineItem}>
                      <div className={styles.timelineIcon}>
                        <Icon size={14} />
                      </div>
                      <div className={styles.timelineContent}>
                        <div className={styles.timelineAction}>
                          {actionLabels[item.action] ?? item.action}
                          {' '}
                          <Badge
                            variant={item.status === 'done' ? 'success' : item.status === 'failed' ? 'danger' : 'neutral'}
                            size="sm"
                          >
                            {item.status}
                          </Badge>
                        </div>
                        <div className={styles.timelineTime}>
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div className={styles.messages}>
              {messages.length === 0 ? (
                <p className={styles.emptyTab}>No messages sent yet</p>
              ) : (
                messages.map((msg) => {
                  const payload = msg.payload as { message?: string }
                  return (
                    <div key={msg.id}>
                      <div className={styles.messageBubble}>
                        {payload.message ?? '(no content)'}
                      </div>
                      <div className={styles.messageTime}>
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <>
              <textarea
                className={styles.notesTextarea}
                defaultValue={lead.notes ?? ''}
                placeholder="Add notes about this lead..."
                onBlur={(e) => handleNotesBlur(e.target.value)}
              />

              <div className={styles.tagsSection}>
                <span className={styles.tagsLabel}>Tags</span>
                <div className={styles.tagsList}>
                  {lead.tags.map((tag) => (
                    <span key={tag} className={styles.tagChip}>
                      {tag}
                      <span className={styles.tagRemove} onClick={() => handleRemoveTag(tag)}>
                        <X size={12} />
                      </span>
                    </span>
                  ))}
                </div>
                <input
                  className={styles.tagInput}
                  placeholder="Add tag + Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              updateLead.mutate(
                { id: leadId, status: 'replied' },
                { onSuccess: () => toast.success('Marked as replied') },
              )
            }}
          >
            Mark as replied
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              updateLead.mutate(
                { id: leadId, status: 'not_interested' },
                { onSuccess: () => toast.success('Lead skipped') },
              )
            }}
          >
            Skip
          </Button>
        </div>
      </motion.div>
    </>
  )
}

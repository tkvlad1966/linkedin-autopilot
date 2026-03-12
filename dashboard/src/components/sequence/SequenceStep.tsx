import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2, UserPlus, MessageSquare, Reply, Heart, Eye } from 'lucide-react'
import type { SequenceStep as StepType, SequenceStepType } from '@shared/types'
import styles from './SequenceStep.module.scss'

const typeConfig: Record<SequenceStepType, { label: string; icon: typeof UserPlus; className: string }> = {
  connect: { label: 'Connect', icon: UserPlus, className: styles.typeConnect },
  message: { label: 'Message', icon: MessageSquare, className: styles.typeMessage },
  followup: { label: 'Follow-up', icon: Reply, className: styles.typeFollowup },
  like: { label: 'Like Post', icon: Heart, className: styles.typeLike },
  view_profile: { label: 'View Profile', icon: Eye, className: styles.typeViewProfile },
}

interface Props {
  step: StepType
  index: number
  onEdit(step: StepType): void
  onDelete(id: string): void
}

export function SequenceStepCard({ step, index, onEdit, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const cfg = typeConfig[step.type]
  const Icon = cfg.icon

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.wrapper} ${cfg.className}`}
    >
      <div className={styles.stepNumber}>{index + 1}</div>

      <div className={styles.card}>
        <div className={styles.left}>
          <span className={styles.handle} {...attributes} {...listeners}>
            <GripVertical size={16} />
          </span>
        </div>

        <div className={styles.center}>
          <div className={styles.typeRow}>
            <span className={styles.typeIcon}>
              <Icon size={16} />
            </span>
            <span className={styles.typeLabel}>{cfg.label}</span>
            <span className={styles.delayBadge}>
              Wait {step.delay_days} day{step.delay_days !== 1 ? 's' : ''}
            </span>
          </div>
          {step.message_template && (
            <div className={styles.messagePreview}>{step.message_template}</div>
          )}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => onEdit(step)}
            aria-label="Edit step"
          >
            <Pencil size={14} />
          </button>
          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={() => onDelete(step.id)}
            aria-label="Delete step"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

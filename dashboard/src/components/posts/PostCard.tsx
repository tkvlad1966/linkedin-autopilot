import { Pencil, Trash2, Send } from 'lucide-react'
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns'
import type { Post } from '@shared/types'
import { Badge } from '../ui/Badge'
import { useDeletePost, useUpdatePost } from '../../hooks/usePosts'
import styles from './PostCard.module.scss'

const STATUS_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  draft: 'neutral',
  scheduled: 'info',
  published: 'success',
  failed: 'danger',
}

interface PostCardProps {
  post: Post
  onEdit: (post: Post) => void
}

export function PostCard({ post, onEdit }: PostCardProps) {
  const deletePost = useDeletePost()
  const updatePost = useUpdatePost()

  const preview = post.content.length > 140
    ? post.content.slice(0, 140) + '...'
    : post.content

  function formatScheduledTime(dateStr: string) {
    const date = new Date(dateStr)
    if (isToday(date)) return `Today · ${format(date, 'h:mm a')}`
    if (isTomorrow(date)) return `Tomorrow · ${format(date, 'h:mm a')}`
    return format(date, 'MMM d · h:mm a')
  }

  function handleDelete() {
    if (confirm('Delete this post?')) {
      deletePost.mutate(post.id)
    }
  }

  function handlePostNow() {
    if (confirm('Post this now?')) {
      updatePost.mutate({
        id: post.id,
        status: 'draft',
        scheduled_at: null,
      })
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Badge variant={STATUS_VARIANT[post.status]} size="sm">
          {post.status}
        </Badge>
        {post.scheduled_at && (
          <span className={styles.time}>
            {formatScheduledTime(post.scheduled_at)}
          </span>
        )}
        {!post.scheduled_at && (
          <span className={styles.time}>
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </span>
        )}
      </div>

      <p className={styles.content}>{preview}</p>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={() => onEdit(post)}
          title="Edit"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.danger}`}
          onClick={handleDelete}
          disabled={deletePost.isPending}
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
        {post.status === 'scheduled' && (
          <button
            type="button"
            className={styles.postNowBtn}
            onClick={handlePostNow}
            disabled={updatePost.isPending}
          >
            <Send size={12} />
            Post Now
          </button>
        )}
      </div>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { isSameDay, format } from 'date-fns'
import type { Post } from '@shared/types'
import { usePosts } from '../hooks/usePosts'
import { PostComposer } from '../components/posts/PostComposer'
import { PostCalendar } from '../components/posts/PostCalendar'
import { PostCard } from '../components/posts/PostCard'
import styles from './Posts.module.scss'

export function Posts() {
  const { data: posts = [], isLoading } = usePosts()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  // TODO: wire editing into PostComposer in a future iteration
  const [, setEditingPost] = useState<Post | null>(null)

  // Filter posts by selected date
  const filteredPosts = useMemo(() => {
    if (!selectedDate) return posts
    return posts.filter((p) => {
      const postDate = new Date(p.scheduled_at ?? p.created_at)
      return isSameDay(postDate, selectedDate)
    })
  }, [posts, selectedDate])

  // Upcoming posts (scheduled, sorted by time)
  const upcomingPosts = useMemo(() => {
    return filteredPosts
      .filter((p) => p.status === 'scheduled' || p.status === 'draft')
      .sort((a, b) => {
        const aDate = a.scheduled_at ?? a.created_at
        const bDate = b.scheduled_at ?? b.created_at
        return new Date(aDate).getTime() - new Date(bDate).getTime()
      })
  }, [filteredPosts])

  const publishedPosts = useMemo(() => {
    return filteredPosts
      .filter((p) => p.status === 'published')
      .sort((a, b) => new Date(b.published_at ?? b.created_at).getTime() - new Date(a.published_at ?? a.created_at).getTime())
  }, [filteredPosts])

  function handleEdit(post: Post) {
    setEditingPost(post)
    // For now, scroll to top to use the composer
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleClearDate() {
    setSelectedDate(null)
  }

  return (
    <div className={styles.layout}>
      {/* Left panel — Composer */}
      <div className={styles.leftPanel}>
        <h1 className={styles.title}>Posts</h1>
        <PostComposer />
      </div>

      {/* Right panel — Calendar + posts list */}
      <div className={styles.rightPanel}>
        <PostCalendar
          posts={posts}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* Date filter indicator */}
        {selectedDate && (
          <div className={styles.dateFilter}>
            <span className={styles.dateFilterText}>
              Showing posts for {format(selectedDate, 'MMMM d, yyyy')}
            </span>
            <button
              type="button"
              className={styles.clearDateBtn}
              onClick={handleClearDate}
            >
              Show all
            </button>
          </div>
        )}

        {/* Posts list */}
        {isLoading ? (
          <p className={styles.loading}>Loading posts...</p>
        ) : (
          <div className={styles.postsList}>
            {upcomingPosts.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Upcoming</h3>
                <div className={styles.postsGrid}>
                  {upcomingPosts.map((post) => (
                    <PostCard key={post.id} post={post} onEdit={handleEdit} />
                  ))}
                </div>
              </div>
            )}

            {publishedPosts.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Published</h3>
                <div className={styles.postsGrid}>
                  {publishedPosts.map((post) => (
                    <PostCard key={post.id} post={post} onEdit={handleEdit} />
                  ))}
                </div>
              </div>
            )}

            {filteredPosts.length === 0 && (
              <div className={styles.empty}>
                {selectedDate
                  ? 'No posts scheduled for this day.'
                  : 'No posts yet. Create your first one!'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

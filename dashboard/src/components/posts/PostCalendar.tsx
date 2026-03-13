import { useState, useMemo } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Post } from '@shared/types'
import styles from './PostCalendar.module.scss'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface PostCalendarProps {
  posts: Post[]
  selectedDate: Date | null
  onSelectDate: (date: Date) => void
}

export function PostCalendar({ posts, selectedDate, onSelectDate }: PostCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart)
    const calEnd = endOfWeek(monthEnd)
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  // Build a set of date strings that have posts
  const postDateSet = useMemo(() => {
    const set = new Set<string>()
    for (const post of posts) {
      const dateStr = post.scheduled_at ?? post.created_at
      set.add(format(new Date(dateStr), 'yyyy-MM-dd'))
    }
    return set
  }, [posts])

  function hasPostsOnDay(day: Date) {
    return postDateSet.has(format(day, 'yyyy-MM-dd'))
  }

  return (
    <div className={styles.calendar}>
      {/* Header */}
      <div className={styles.header}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft size={16} />
        </button>
        <span className={styles.monthLabel}>
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday labels */}
      <div className={styles.weekdays}>
        {WEEKDAYS.map((d) => (
          <span key={d} className={styles.weekday}>{d}</span>
        ))}
      </div>

      {/* Days grid */}
      <div className={styles.grid}>
        {days.map((day) => {
          const inMonth = isSameMonth(day, currentMonth)
          const today = isToday(day)
          const selected = selectedDate && isSameDay(day, selectedDate)
          const hasPosts = hasPostsOnDay(day)

          return (
            <button
              key={day.toISOString()}
              type="button"
              className={[
                styles.day,
                !inMonth && styles.outside,
                today && styles.today,
                selected && styles.selected,
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectDate(day)}
            >
              <span className={styles.dayNumber}>{format(day, 'd')}</span>
              {hasPosts && <span className={styles.dot} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

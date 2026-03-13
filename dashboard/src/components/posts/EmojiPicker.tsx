import { useRef, useEffect } from 'react'
import styles from './EmojiPicker.module.scss'

const EMOJIS = [
  '😀', '😂', '🥹', '😍', '🤩', '😎', '🤔', '🫡',
  '🔥', '💯', '✨', '🎯', '🚀', '💡', '🎉', '👏',
  '💪', '🙌', '👀', '🤝', '❤️', '💙', '💚', '💜',
  '✅', '⭐', '📈', '📊', '🏆', '🎓', '💼', '📝',
  '⚡', '🌟', '🔑', '🧠', '💰', '📱', '🖥️', '🤖',
]

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div ref={ref} className={styles.picker}>
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className={styles.emoji}
          onClick={() => {
            onSelect(emoji)
            onClose()
          }}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

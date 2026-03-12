import { forwardRef, type InputHTMLAttributes } from 'react'
import styles from './Input.module.scss'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={styles.wrapper}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[styles.input, error && styles.hasError, className]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />
        {error && (
          <span id={`${inputId}-error`} className={styles.errorText}>
            {error}
          </span>
        )}
        {!error && helperText && (
          <span className={styles.helperText}>{helperText}</span>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

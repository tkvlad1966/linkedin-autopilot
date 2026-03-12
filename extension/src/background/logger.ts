const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  debug: (msg: string, data?: unknown): void => {
    if (isDev) console.debug('[AP]', msg, ...(data !== undefined ? [data] : []))
  },
  info: (msg: string, data?: unknown): void => {
    console.info('[AP]', msg, ...(data !== undefined ? [data] : []))
  },
  warn: (msg: string, data?: unknown): void => {
    console.warn('[AP]', msg, ...(data !== undefined ? [data] : []))
  },
  error: (msg: string, data?: unknown): void => {
    console.error('[AP]', msg, ...(data !== undefined ? [data] : []))
  },
}

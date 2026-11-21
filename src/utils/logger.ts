const isDev = import.meta.env.DEV

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (isDev) console.log(`%c[INFO] ${new Date().toISOString()}`, 'color: #2563EB', message, ...args)
  },
  warn: (message: string, ...args: unknown[]) => {
    if (isDev) console.warn(`[WARN] ${new Date().toISOString()} — ${message}`, ...args)
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${new Date().toISOString()} — ${message}`, ...args)
  },
  debug: (message: string, ...args: unknown[]) => {
    if (isDev) console.debug(`[DEBUG] ${new Date().toISOString()}`, message, ...args)
  },
  api: (method: string, url: string, payload?: unknown) => {
    if (isDev) console.log(`%c[API] ${method} ${url}`, 'color: #16A34A', payload ?? '')
  },
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt: () => Promise<void>
}

type InstallPromptListener = (
  prompt: BeforeInstallPromptEvent | null,
) => void

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<InstallPromptListener>()

const notify = () => {
  listeners.forEach((listener) => listener(deferredPrompt))
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

export const getDeferredInstallPrompt = () => deferredPrompt

export const subscribeInstallPrompt = (
  listener: InstallPromptListener,
) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const consumeInstallPrompt = () => {
  const prompt = deferredPrompt
  deferredPrompt = null
  notify()
  return prompt
}

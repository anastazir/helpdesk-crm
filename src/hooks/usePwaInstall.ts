import { useEffect, useState } from 'react'

import {
  consumeInstallPrompt,
  getDeferredInstallPrompt,
  subscribeInstallPrompt,
  type BeforeInstallPromptEvent,
} from '@/lib/pwaInstallPrompt'

export type PwaInstallOutcome =
  | 'accepted'
  | 'dismissed'
  | 'unavailable'

const isStandalone = (): boolean => {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean
  }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
  )
}

export const usePwaInstall = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(getDeferredInstallPrompt)
  const [isInstalled, setIsInstalled] = useState(isStandalone)

  useEffect(() => {
    const unsubscribe = subscribeInstallPrompt(setDeferredPrompt)
    const handleInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      unsubscribe()
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const install = async (): Promise<PwaInstallOutcome> => {
    const prompt = deferredPrompt ?? getDeferredInstallPrompt()
    if (!prompt) return 'unavailable'
    try {
      await prompt.prompt()
      const choice = await prompt.userChoice
      consumeInstallPrompt()
      if (choice.outcome === 'accepted') {
        setIsInstalled(true)
      }
      return choice.outcome
    } catch {
      consumeInstallPrompt()
      return 'unavailable'
    }
  }

  return {
    isInstallable: deferredPrompt !== null,
    isInstalled,
    install,
  }
}

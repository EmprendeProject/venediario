import { useCallback, useEffect, useMemo, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function getIsIOS(): boolean {
  const ua = navigator.userAgent || ''
  return /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ se identifica como Mac; detectamos touch.
    (ua.includes('Mac') && 'ontouchend' in document)
}

function getIsStandalone(): boolean {
  // iOS Safari expone navigator.standalone
  const nav = navigator as Navigator & { standalone?: boolean }
  if (typeof nav.standalone === 'boolean') return nav.standalone
  // Android/desktop
  return window.matchMedia?.('(display-mode: standalone)')?.matches ?? false
}

export function useAddToHomeScreen() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return getIsStandalone()
  })

  const isIOS = useMemo(() => {
    if (typeof window === 'undefined') return false
    return getIsIOS()
  }, [])

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      // Evita el mini-infobar automático y nos deja dispararlo desde un botón.
      e.preventDefault?.()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const onAppInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    // Mantener el estado sincronizado si cambia el display-mode
    const media = window.matchMedia?.('(display-mode: standalone)')
    const onMediaChange = () => setInstalled(getIsStandalone())
    media?.addEventListener?.('change', onMediaChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
      media?.removeEventListener?.('change', onMediaChange)
    }
  }, [])

  const isInstallable = !!deferredPrompt

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return { didPrompt: false, outcome: 'dismissed' as const }
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    // Si aceptó, el evento appinstalled puede dispararse luego.
    setDeferredPrompt(null)
    return { didPrompt: true, outcome: choice.outcome }
  }, [deferredPrompt])

  return {
    isIOS,
    installed,
    isInstallable,
    promptInstall,
  }
}

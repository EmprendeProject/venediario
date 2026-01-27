import { useMemo, useState } from 'react'
import { Card } from 'konsta/react'
import { useAddToHomeScreen } from '../hooks/useAddToHomeScreen'

function isSafariIOS(): boolean {
  const ua = navigator.userAgent || ''
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)
  // En iOS todos los browsers usan WebKit, pero para A2HS la guía es Safari.
  // Detectamos Safari de forma aproximada.
  const isSafari = isIOS && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
  return isSafari
}

function isChromiumInstallPromptCapable(): boolean {
  const ua = navigator.userAgent || ''
  // beforeinstallprompt típicamente existe en Chromium (Chrome/Edge/Brave/etc.)
  // Safari/Firefox no lo exponen.
  return /(Chrome|Chromium|Edg|Brave)/.test(ua) && !/OPR/.test(ua)
}

export default function AddToHomeScreenCTA() {
  const { isIOS, installed, isInstallable, promptInstall } = useAddToHomeScreen()
  const [showIOSHelp, setShowIOSHelp] = useState(false)
  const [busy, setBusy] = useState(false)
  const [showAndroidHint, setShowAndroidHint] = useState(false)

  const isSecure = typeof window !== 'undefined' ? window.isSecureContext : false
  const isChromium = typeof window !== 'undefined' ? isChromiumInstallPromptCapable() : false

  const show = useMemo(() => {
    if (installed) return false
    // Mostramos siempre (si no está instalada):
    // - En Android/Chromium el botón se habilita cuando hay prompt.
    // - En iOS mostramos instrucciones.
    return true
  }, [installed, isInstallable, isIOS])

  if (!show) return null

  return (
    <div className="mt-6 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
      <Card className="!m-0 !p-4 !rounded-2xl !shadow-sm bg-white border border-gray-100">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-semibold">
            +
          </div>

          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900">Añadir a pantalla de inicio</div>
            <div className="text-xs text-gray-600 mt-0.5">
              Instálala para abrir más rápido y en pantalla completa.
            </div>

            <div className="mt-3 flex gap-2">
              {!isIOS ? (
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium disabled:opacity-60"
                  disabled={busy || !isInstallable}
                  onClick={async () => {
                    if (!isInstallable) {
                      setShowAndroidHint(true)
                      return
                    }
                    try {
                      setBusy(true)
                      await promptInstall()
                    } finally {
                      setBusy(false)
                    }
                  }}
                >
                  Instalar
                </button>
              ) : null}

              {isIOS ? (
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm font-medium"
                  onClick={() => setShowIOSHelp(true)}
                >
                  Cómo hacerlo
                </button>
              ) : null}
            </div>

            {!isIOS && (!isInstallable || showAndroidHint) ? (
              <div className="mt-2 text-[11px] text-gray-500">
                {!isChromium ? (
                  <>Para instalar con un botón, abre esta web en <span className="font-semibold">Chrome o Edge</span>. En Safari/Firefox suele no aparecer el prompt.</>
                ) : !isSecure ? (
                  <>El navegador requiere un contexto seguro: <span className="font-semibold">HTTPS o localhost</span>. Si estás abriendo por <span className="font-semibold">http://192.168.x.x</span> el prompt no se habilita.</>
                ) : (
                  <>Aún no aparece el prompt. Prueba recargar y navegar 1–2 veces; a veces Chrome lo muestra tras algo de “engagement”. También revisa el menú del navegador (opción “Instalar app”).</>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      {showIOSHelp && isIOS ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowIOSHelp(false)}
        >
          <div
            className="w-full max-w-[720px]"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="!m-0 !p-4 !rounded-2xl !shadow-lg bg-white border border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">En iPhone / iPad</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {isSafariIOS() ? (
                      <>En Safari: toca <span className="font-semibold">Compartir</span> → <span className="font-semibold">Añadir a pantalla de inicio</span>.</>
                    ) : (
                      <>Abre esta página en <span className="font-semibold">Safari</span> y luego toca <span className="font-semibold">Compartir</span> → <span className="font-semibold">Añadir a pantalla de inicio</span>.</>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-900 text-sm font-medium"
                  onClick={() => setShowIOSHelp(false)}
                >
                  Cerrar
                </button>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  )
}

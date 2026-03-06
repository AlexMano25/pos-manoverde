import { useState, useMemo } from 'react'
import { X, Monitor, Smartphone, Tablet, ChevronRight, Download } from 'lucide-react'
import { useLanguageStore } from '../../stores/languageStore'
import { useAppStore } from '../../stores/appStore'

type Props = {
  isOpen: boolean
  onClose: () => void
}

type Platform = 'android' | 'ios' | 'desktop'

function detectPlatform(): Platform {
  const ua = navigator.userAgent
  if (/android/i.test(ua)) return 'android'
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  return 'desktop'
}

// i18n helper
function getInstallKey(t: Record<string, unknown>, key: string): string {
  const install = t.install as Record<string, string> | undefined
  return install?.[key] || fallbacks[key] || key
}

const fallbacks: Record<string, string> = {
  title: 'Installer l\'application',
  description: 'Installez POS Mano Verde pour un accès rapide depuis votre écran d\'accueil.',
  installButton: 'Installer',
  howToInstall: 'Comment installer',
  tutorialTitle: 'Guide d\'installation',
  androidStep1: 'Appuyez sur le menu ⋮ (3 points) en haut à droite de Chrome',
  androidStep2: 'Sélectionnez "Installer l\'application" ou "Ajouter à l\'écran d\'accueil"',
  androidStep3: 'Confirmez l\'installation — l\'app apparaît sur votre écran d\'accueil',
  iosStep1: 'Appuyez sur le bouton Partager ⬆ en bas de Safari',
  iosStep2: 'Faites défiler et appuyez sur "Sur l\'écran d\'accueil"',
  iosStep3: 'Appuyez sur "Ajouter" — l\'app apparaît sur votre écran d\'accueil',
  desktopStep1: 'Cliquez sur l\'icône d\'installation ⊕ dans la barre d\'adresse',
  desktopStep2: 'Cliquez sur "Installer" dans la boîte de dialogue',
  desktopStep3: 'L\'app s\'ouvre dans sa propre fenêtre — épinglez-la à votre barre des tâches',
  step: 'Étape',
  done: 'Compris !',
  alreadyInstalled: 'L\'application est déjà installée !',
}

export default function InstallTutorial({ isOpen, onClose }: Props) {
  const { t } = useLanguageStore()
  const { installPromptEvent, setInstallPromptEvent, setIsAppInstalled } = useAppStore()
  const tAny = t as unknown as Record<string, unknown>

  const [platform, setPlatform] = useState<Platform>(detectPlatform)
  const [currentStep, setCurrentStep] = useState(0)

  const tk = (key: string) => getInstallKey(tAny, key)

  const handleNativeInstall = async () => {
    if (!installPromptEvent) return
    try {
      await installPromptEvent.prompt()
      const result = await installPromptEvent.userChoice
      if (result.outcome === 'accepted') {
        setIsAppInstalled(true)
        setInstallPromptEvent(null)
        onClose()
      }
    } catch {
      // User dismissed
    }
  }

  const platforms: { id: Platform; label: string; icon: typeof Smartphone }[] = [
    { id: 'android', label: 'Android', icon: Smartphone },
    { id: 'ios', label: 'iOS', icon: Tablet },
    { id: 'desktop', label: 'Desktop', icon: Monitor },
  ]

  const steps = useMemo(() => {
    const prefix = platform === 'android' ? 'android' : platform === 'ios' ? 'ios' : 'desktop'
    return [
      tk(`${prefix}Step1`),
      tk(`${prefix}Step2`),
      tk(`${prefix}Step3`),
    ]
  }, [platform, t])

  if (!isOpen) return null

  // CSS mockup illustrations per step
  const renderIllustration = () => {
    if (platform === 'android') {
      return (
        <div style={{
          width: 200,
          height: 140,
          margin: '0 auto 20px',
          backgroundColor: '#f8fafc',
          borderRadius: 12,
          border: '2px solid #e2e8f0',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Browser chrome */}
          <div style={{
            height: 32,
            backgroundColor: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px',
          }}>
            <div style={{ width: 80, height: 10, backgroundColor: '#334155', borderRadius: 5 }} />
            {currentStep === 0 && (
              <div style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                border: '2px solid #60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 1.5s infinite',
              }}>
                <span style={{ color: '#60a5fa', fontSize: 14, fontWeight: 700, lineHeight: 1 }}>⋮</span>
              </div>
            )}
          </div>
          {/* Content area */}
          <div style={{ padding: 10 }}>
            {currentStep === 0 && (
              <div style={{
                position: 'absolute',
                right: 8,
                top: 34,
                backgroundColor: '#fff',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                padding: 6,
                zIndex: 2,
              }}>
                {['Installer l\'app', 'Partager...', 'Rechercher'].map((item, i) => (
                  <div key={i} style={{
                    padding: '6px 10px',
                    fontSize: 10,
                    color: i === 0 ? '#2563eb' : '#64748b',
                    fontWeight: i === 0 ? 700 : 400,
                    backgroundColor: i === 0 ? '#eff6ff' : 'transparent',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    {i === 0 && <Download size={10} />}
                    {item}
                  </div>
                ))}
              </div>
            )}
            {currentStep === 1 && (
              <div style={{
                backgroundColor: '#fff',
                borderRadius: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                padding: 12,
                textAlign: 'center',
                margin: '10px auto',
                maxWidth: 160,
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#2563eb', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: 14 }}>M</span>
                </div>
                <p style={{ fontSize: 10, fontWeight: 600, color: '#1e293b', margin: '0 0 8px' }}>Installer POS ?</p>
                <div style={{
                  padding: '5px 16px',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 600,
                  animation: 'pulse 1.5s infinite',
                }}>
                  Installer
                </div>
              </div>
            )}
            {currentStep === 2 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', paddingTop: 10 }}>
                {['POS', 'Chrome', 'Photos', 'Gmail'].map((app, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: i === 0 ? '#2563eb' : '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 4px',
                      border: i === 0 ? '2px solid #60a5fa' : 'none',
                      animation: i === 0 ? 'pulse 1.5s infinite' : 'none',
                    }}>
                      <span style={{ fontSize: 10, color: i === 0 ? '#fff' : '#94a3b8', fontWeight: 700 }}>
                        {app[0]}
                      </span>
                    </div>
                    <span style={{ fontSize: 8, color: '#64748b' }}>{app}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )
    }

    if (platform === 'ios') {
      return (
        <div style={{
          width: 200,
          height: 140,
          margin: '0 auto 20px',
          backgroundColor: '#f8fafc',
          borderRadius: 12,
          border: '2px solid #e2e8f0',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Safari chrome */}
          <div style={{ height: 28, backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ width: 100, height: 10, backgroundColor: '#e2e8f0', borderRadius: 5 }} />
          </div>
          <div style={{ flex: 1, padding: 6 }}>
            {currentStep === 1 && (
              <div style={{
                backgroundColor: '#fff',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                padding: 6,
              }}>
                {['Copier', 'Ajouter aux favoris', 'Sur l\'écran d\'accueil'].map((item, i) => (
                  <div key={i} style={{
                    padding: '5px 8px',
                    fontSize: 9,
                    color: i === 2 ? '#2563eb' : '#64748b',
                    fontWeight: i === 2 ? 700 : 400,
                    backgroundColor: i === 2 ? '#eff6ff' : 'transparent',
                    borderRadius: 4,
                    borderTop: i > 0 ? '1px solid #f1f5f9' : 'none',
                  }}>
                    {item}
                  </div>
                ))}
              </div>
            )}
            {currentStep === 2 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', paddingTop: 16 }}>
                {['POS', 'Safari', 'Photos'].map((app, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: i === 0 ? '#2563eb' : '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 4px',
                      animation: i === 0 ? 'pulse 1.5s infinite' : 'none',
                    }}>
                      <span style={{ fontSize: 10, color: i === 0 ? '#fff' : '#94a3b8', fontWeight: 700 }}>
                        {app[0]}
                      </span>
                    </div>
                    <span style={{ fontSize: 8, color: '#64748b' }}>{app}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Bottom bar */}
          <div style={{
            height: 28,
            backgroundColor: '#f1f5f9',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
          }}>
            {['◁', '▷', '⬆', '⊞', '⊡'].map((icon, i) => (
              <span key={i} style={{
                fontSize: 12,
                color: i === 2 && currentStep === 0 ? '#2563eb' : '#94a3b8',
                fontWeight: i === 2 && currentStep === 0 ? 800 : 400,
                animation: i === 2 && currentStep === 0 ? 'pulse 1.5s infinite' : 'none',
              }}>
                {icon}
              </span>
            ))}
          </div>
        </div>
      )
    }

    // Desktop
    return (
      <div style={{
        width: 240,
        height: 140,
        margin: '0 auto 20px',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        border: '2px solid #e2e8f0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Browser chrome */}
        <div style={{
          height: 30,
          backgroundColor: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 10px',
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {['#ef4444', '#f59e0b', '#22c55e'].map((c, i) => (
              <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: c }} />
            ))}
          </div>
          <div style={{ flex: 1, height: 14, backgroundColor: '#334155', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px' }}>
            <span style={{ fontSize: 7, color: '#94a3b8' }}>pos.manoverde.com</span>
            {currentStep === 0 && (
              <div style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                backgroundColor: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 1.5s infinite',
              }}>
                <Download size={8} color="#fff" />
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: 10 }}>
          {currentStep === 1 && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              padding: 12,
              textAlign: 'center',
              maxWidth: 180,
              margin: '6px auto',
            }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#1e293b', margin: '0 0 8px' }}>Installer POS Mano Verde ?</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <span style={{ fontSize: 9, color: '#64748b', padding: '4px 10px' }}>Annuler</span>
                <span style={{
                  fontSize: 9,
                  color: '#fff',
                  backgroundColor: '#2563eb',
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontWeight: 600,
                  animation: 'pulse 1.5s infinite',
                }}>Installer</span>
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div style={{
              backgroundColor: '#1e293b',
              borderRadius: 8,
              padding: 8,
              maxWidth: 140,
              margin: '6px auto',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: 8, fontWeight: 700 }}>M</span>
                </div>
                <span style={{ color: '#e2e8f0', fontSize: 9, fontWeight: 600 }}>POS Mano Verde</span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9998,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 440,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 }}>
            {tk('tutorialTitle')}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: '#94a3b8',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Platform tabs */}
        <div style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid #e2e8f0',
        }}>
          {platforms.map((p) => {
            const Icon = p.icon
            const active = platform === p.id
            return (
              <button
                key={p.id}
                onClick={() => { setPlatform(p.id); setCurrentStep(0) }}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#2563eb' : '#64748b',
                  borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={16} />
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div style={{ padding: 20 }}>
          {/* Native install button */}
          {installPromptEvent && (
            <button
              onClick={handleNativeInstall}
              style={{
                width: '100%',
                padding: '14px 0',
                borderRadius: 10,
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#fff',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 20,
              }}
            >
              <Download size={18} />
              {tk('installButton')}
            </button>
          )}

          {/* Step indicators */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 20,
          }}>
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                style={{
                  width: currentStep === i ? 28 : 10,
                  height: 10,
                  borderRadius: 5,
                  border: 'none',
                  backgroundColor: currentStep === i ? '#2563eb' : '#e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </div>

          {/* Illustration */}
          {renderIllustration()}

          {/* Step text */}
          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#2563eb',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 6,
            }}>
              {tk('step')} {currentStep + 1}/3
            </div>
            <p style={{ fontSize: 14, color: '#1e293b', margin: 0, lineHeight: 1.5 }}>
              {steps[currentStep]}
            </p>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
            {currentStep > 0 ? (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#fff',
                  color: '#64748b',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                ← {tk('step')} {currentStep}
              </button>
            ) : <div />}

            {currentStep < 2 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {tk('step')} {currentStep + 2} <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#16a34a',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {tk('done')}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  )
}

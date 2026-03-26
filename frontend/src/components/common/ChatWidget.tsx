import React, { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Mic, MicOff, Volume2 } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useAppStore } from '../../stores/appStore'
import { supabase, isSupabaseConfigured } from '../../services/supabase'

// ── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isAudio?: boolean
}

interface ChatWidgetProps {
  pageKey: string
  userRole?: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const CHAT_HISTORY_KEY = 'pos_chat_history'
const CHAT_NAME_KEY = 'pos_chat_name'
const BOT_NAME = 'Mano'
const BOT_AVATAR = '🟢'
const MAX_HISTORY = 50

const C = {
  whatsappGreen: '#25D366',
  whatsappDark: '#075E54',
  whatsappHeader: '#128C7E',
  whatsappBg: '#ECE5DD',
  whatsappChatBg: '#e5ddd5',
  userBubble: '#DCF8C6',
  botBubble: '#ffffff',
  textDark: '#303030',
  textLight: '#667781',
  inputBg: '#f0f2f5',
  white: '#ffffff',
  shadow: 'rgba(0,0,0,0.15)',
}

// ── Utility ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY)
    if (raw) return JSON.parse(raw).slice(-MAX_HISTORY)
  } catch { /* ignore */ }
  return []
}

function saveHistory(messages: ChatMessage[]) {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)))
  } catch { /* ignore */ }
}

function getSavedName(): string {
  try { return localStorage.getItem(CHAT_NAME_KEY) || '' } catch { return '' }
}
function saveName(name: string) {
  try { localStorage.setItem(CHAT_NAME_KEY, name) } catch { /* ignore */ }
}

// ── Quick reply knowledge base (offline fallback) ────────────────────────────

function getOfflineReply(msg: string, context: { role?: string; page?: string }): { reply: string; suggestions: string[] } {
  const lower = msg.toLowerCase().trim()

  // Greetings
  if (/^(bonjour|salut|hello|hi|hey|bonsoir|coucou)/.test(lower)) {
    const name = getSavedName()
    return {
      reply: name
        ? `Bonjour ${name} ! 👋 Comment puis-je vous aider aujourd'hui ?`
        : `Bonjour ! 👋 Je suis ${BOT_NAME}, votre assistant POS Mano Verde. Comment puis-je vous aider ?`,
      suggestions: ['Quelles sont les fonctionnalites ?', 'Comment demarrer ?', 'Quels sont les tarifs ?'],
    }
  }

  // Pricing
  if (/prix|tarif|cout|combien|gratuit|plan|abonnement|pricing/.test(lower)) {
    return {
      reply: `💰 *Nos plans tarifaires :*\n\n` +
        `🆓 *Gratuit* — 0 FCFA/mois\n• 20 commandes/jour, 50 produits, 1 boutique\n\n` +
        `⭐ *Starter* — a partir de 5 000 FCFA/mois\n• 200 commandes/jour, 500 produits, 2 boutiques\n\n` +
        `🚀 *Pro* — a partir de 15 000 FCFA/mois\n• Illimite, 5 boutiques, toutes fonctionnalites\n\n` +
        `🏢 *Enterprise* — Sur devis\n• Multi-sites, API, support prioritaire\n\n` +
        `💡 *Pay-as-you-grow* — 0,02 USD/ticket\n• Tout illimite, payez a l'usage\n\nVoulez-vous demarrer avec le plan gratuit ? 🚀`,
      suggestions: ['Demarrer gratuitement', 'Comparer les plans', 'Devenir partenaire'],
    }
  }

  // Features
  if (/fonctionnalit|feature|quoi.*faire|capable|peut.*faire/.test(lower)) {
    return {
      reply: `✨ *POS Mano Verde offre :*\n\n` +
        `📱 Point de vente (POS)\n` +
        `📦 Gestion de stock\n` +
        `👥 Gestion clients (CRM)\n` +
        `📊 Rapports et statistiques\n` +
        `🍽️ Ecran cuisine (KDS)\n` +
        `🖨️ Impression Bluetooth\n` +
        `📴 Mode hors-ligne\n` +
        `🌍 Multi-devises (25+ monnaies)\n` +
        `🗣️ 7 langues supportees\n` +
        `👷 27 types d'activites\n` +
        `📱 Fonctionne sur telephone, tablette et PC`,
      suggestions: ['Quelles activites ?', 'Comment ca marche offline ?', 'Voir les tarifs'],
    }
  }

  // Activities
  if (/activit|secteur|metier|commerce|restaurant|pharmacie|boutique|hotel/.test(lower)) {
    return {
      reply: `🏪 *27 types d'activites supportes :*\n\n` +
        `🍽️ Restaurant, Bar, Fast-food, Boulangerie\n` +
        `🏨 Hotel, Coffee Shop, Food Truck\n` +
        `🛒 Supermarche, Boutique, Electronique\n` +
        `💊 Pharmacie, Cosmetique, Mode\n` +
        `🔧 Garage Auto, BTP, Services\n` +
        `📚 Librairie, Ecole, Immobilier\n` +
        `⛽ Station Service, Pressing, Laverie\n` +
        `🧊 Glacier, Bar a jus, Traiteur\n\n` +
        `Chaque activite a ses propres champs produit et fonctionnalites adaptees !`,
      suggestions: ['Demarrer maintenant', 'Voir les fonctionnalites', 'Parler a un conseiller'],
    }
  }

  // Offline mode
  if (/offline|hors.ligne|sans.internet|connexion/.test(lower)) {
    return {
      reply: `📴 *Mode hors-ligne :*\n\n` +
        `POS Mano Verde fonctionne *meme sans internet* !\n\n` +
        `✅ Creer des ventes\n` +
        `✅ Gerer les produits\n` +
        `✅ Imprimer des tickets Bluetooth\n` +
        `✅ Consulter les rapports\n\n` +
        `Quand internet revient, tout se synchronise automatiquement avec le cloud. 🔄`,
      suggestions: ['Comment installer ?', 'Multi-appareils ?', 'Voir les tarifs'],
    }
  }

  // Partner program
  if (/partenaire|agent|commission|gagner|revenu|affili/.test(lower)) {
    return {
      reply: `🤝 *Programme Partenaire Mano Verde :*\n\n` +
        `Gagnez de l'argent en aidant les commerces a se digitaliser !\n\n` +
        `💰 *4 niveaux de commissions :*\n` +
        `1️⃣ Debutant — 5% de commission\n` +
        `2️⃣ Confirmé — 10%\n` +
        `3️⃣ Expert — 15%\n` +
        `4️⃣ Elite — 20%\n\n` +
        `📈 Montee de niveau automatique\n` +
        `📲 Activite simple avec votre telephone\n` +
        `💸 Revenus recurrents\n\n` +
        `👉 Inscrivez-vous directement sur le site !`,
      suggestions: ['Comment s\'inscrire ?', 'Combien je peux gagner ?', 'Voir les conditions'],
    }
  }

  // How to start
  if (/comment.*commencer|demarrer|inscription|s'inscrire|creer.*compte|commencer/.test(lower)) {
    return {
      reply: `🚀 *Pour demarrer, c'est simple :*\n\n` +
        `1️⃣ Cliquez sur "Demarrer maintenant"\n` +
        `2️⃣ Choisissez votre type d'activite\n` +
        `3️⃣ Creez votre compte (email + mot de passe)\n` +
        `4️⃣ Ajoutez vos produits\n` +
        `5️⃣ Commencez a vendre !\n\n` +
        `💡 Le plan gratuit est disponible immediatement, sans carte bancaire.`,
      suggestions: ['Voir les tarifs', 'Quelles fonctionnalites ?', 'Aide pour configurer'],
    }
  }

  // Contact / support
  if (/contact|support|aide|probleme|email|mail|reclamation|plainte/.test(lower)) {
    return {
      reply: `📧 *Contactez-nous :*\n\n` +
        `✉️ Email : support@manoverde.com\n` +
        `💬 WhatsApp : disponible sur le site\n\n` +
        `Notre equipe vous repond generalement sous 24h.\n\n` +
        `Souhaitez-vous que je transmette votre question a notre equipe ?`,
      suggestions: ['Envoyer un message au support', 'Voir la FAQ', 'Autre question'],
    }
  }

  // Logged-in user help
  if (context.role && /comment|aide|utiliser|configurer/.test(lower)) {
    return {
      reply: `💡 Je suis la pour vous guider ! Que souhaitez-vous faire ?\n\n` +
        `📱 Configurer votre boutique\n` +
        `🛍️ Ajouter des produits\n` +
        `💳 Configurer les paiements\n` +
        `👥 Ajouter des employes\n` +
        `🖨️ Configurer l'imprimante\n` +
        `📊 Consulter les rapports`,
      suggestions: ['Ajouter un produit', 'Configurer l\'imprimante', 'Ajouter un employe'],
    }
  }

  // Default - can't answer
  return {
    reply: `Je ne suis pas sur de comprendre votre question. 🤔\n\n` +
      `Voici ce que je peux vous aider avec :\n` +
      `• Fonctionnalites du POS\n` +
      `• Tarifs et plans\n` +
      `• Programme partenaire\n` +
      `• Comment demarrer\n` +
      `• Support technique\n\n` +
      `Ou je peux transmettre votre question a notre equipe.`,
    suggestions: ['Voir les fonctionnalites', 'Voir les tarifs', 'Contacter le support'],
  }
}

// ── Component ────────────────────────────────────────────────────────────────

const ChatWidget: React.FC<ChatWidgetProps> = ({ pageKey, userRole }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showSuggestions, setSuggestions] = useState<string[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const user = useAuthStore((s) => s.user)
  const currentStore = useAppStore((s) => s.currentStore)
  const activity = useAppStore((s) => s.activity)

  // ── Responsive ──────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Auto-scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // ── Save history ────────────────────────────────────────────────────────
  useEffect(() => {
    saveHistory(messages)
  }, [messages])

  // ── Welcome message on first open ───────────────────────────────────────
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const name = user?.name || getSavedName()
      const welcome: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: name
          ? `Bonjour ${name} ! 👋\n\nJe suis ${BOT_NAME}, votre assistant POS Mano Verde. Comment puis-je vous aider ?`
          : `Bonjour ! 👋\n\nJe suis ${BOT_NAME}, votre assistant POS Mano Verde.\n\nJe peux vous aider avec :\n• Les fonctionnalites de la plateforme\n• Les tarifs\n• Le programme partenaire\n• Le support technique\n\nComment puis-je vous aider ?`,
        timestamp: Date.now(),
      }
      setMessages([welcome])
      setSuggestions(['Voir les fonctionnalites', 'Voir les tarifs', 'Devenir partenaire'])
    }
  }, [isOpen])

  // ── Send message ────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return

    // Extract name from conversation
    const nameMatch = text.match(/(?:je\s+(?:suis|m'appelle|me\s+nomme)|my\s+name\s+is|i\s+am)\s+(\w+)/i)
    if (nameMatch) {
      saveName(nameMatch[1])
    }

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)
    setSuggestions([])

    // Try edge function first, fallback to offline
    let reply = ''
    let suggestions: string[] = []
    let escalate = false

    try {
      if (isSupabaseConfigured && supabase) {
        const projectUrl = (supabase as any).supabaseUrl || ''
        const res = await fetch(`${projectUrl}/functions/v1/chat-assistant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text.trim(),
            context: {
              page: pageKey,
              role: userRole || null,
              storeName: currentStore?.name || null,
              activity: activity || null,
              language: 'fr',
            },
            history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          }),
        })

        if (res.ok) {
          const data = await res.json()
          reply = data.reply || ''
          suggestions = data.suggestions || []
          escalate = data.escalate || false
        }
      }
    } catch {
      // Network error — use offline fallback
    }

    // Offline fallback
    if (!reply) {
      const offline = getOfflineReply(text, { role: userRole, page: pageKey })
      reply = offline.reply
      suggestions = offline.suggestions
    }

    // Simulate typing delay
    const delay = Math.min(1500, Math.max(500, reply.length * 8))
    await new Promise((r) => setTimeout(r, delay))

    const botMsg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: reply,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, botMsg])
    setIsTyping(false)
    setSuggestions(suggestions)

    // Escalate to support if needed
    if (escalate && isSupabaseConfigured && supabase) {
      try {
        const projectUrl = (supabase as any).supabaseUrl || ''
        await fetch(`${projectUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'support@manovende.com',
            subject: `[ChatBot] Question non resolue - ${user?.name || 'Visiteur'}`,
            body: `Message: ${text}\n\nPage: ${pageKey}\nRole: ${userRole || 'visiteur'}\nBoutique: ${currentStore?.name || 'N/A'}\n\nHistorique:\n${messages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}`,
          }),
        }).catch(() => {})
      } catch { /* ignore */ }
    }
  }, [messages, pageKey, userRole, currentStore, activity, user])

  // ── Audio recording ─────────────────────────────────────────────────────
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        // For now, just acknowledge the audio
        const audioMsg: ChatMessage = {
          id: generateId(),
          role: 'user',
          content: '🎤 Message vocal envoye',
          timestamp: Date.now(),
          isAudio: true,
        }
        setMessages((prev) => [...prev, audioMsg])

        // Bot response
        setTimeout(() => {
          const botMsg: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: `J'ai bien recu votre message vocal. 🎧\n\nMalheureusement, je ne peux pas encore traiter l'audio directement. Pourriez-vous ecrire votre question ?\n\nOu je peux la transmettre a notre equipe support.`,
            timestamp: Date.now(),
          }
          setMessages((prev) => [...prev, botMsg])
          setSuggestions(['Contacter le support', 'Poser ma question par ecrit'])
        }, 1000)
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch {
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `❌ Impossible d'acceder au microphone. Verifiez les permissions de votre navigateur.`,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMsg])
    }
  }, [isRecording])

  // ── Handle open/close ───────────────────────────────────────────────────
  const handleOpen = useCallback(() => {
    setIsOpen(true)
    setUnreadCount(0)
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  // ── Format message content ──────────────────────────────────────────────
  const formatContent = (text: string) => {
    return text
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  // ── Bottom offset for mobile nav ────────────────────────────────────────
  const bottomOffset = isMobile ? 80 : 24

  // ── Render ──────────────────────────────────────────────────────────────

  if (!isOpen) {
    return (
      <>
        <button
          onClick={handleOpen}
          aria-label="Ouvrir le chat"
          style={{
            position: 'fixed',
            bottom: bottomOffset,
            right: 24,
            zIndex: 9000,
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: C.whatsappGreen,
            color: C.white,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 16px ${C.shadow}`,
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          <MessageCircle size={26} fill="white" />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              backgroundColor: '#ef4444', color: 'white',
              borderRadius: '50%', width: 20, height: 20,
              fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {unreadCount}
            </span>
          )}
        </button>
        <style>{`
          @keyframes chatPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        `}</style>
      </>
    )
  }

  return (
    <>
      {/* Backdrop on mobile */}
      {isMobile && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
        />
      )}

      {/* Chat window */}
      <div style={{
        position: 'fixed',
        bottom: isMobile ? 0 : bottomOffset,
        right: isMobile ? 0 : 24,
        zIndex: 9999,
        width: isMobile ? '100%' : 380,
        height: isMobile ? '100%' : 520,
        maxHeight: isMobile ? '100dvh' : 520,
        borderRadius: isMobile ? 0 : 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{
          backgroundColor: C.whatsappHeader,
          color: C.white,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
          paddingTop: isMobile ? 'max(12px, env(safe-area-inset-top))' : 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            backgroundColor: '#25D366',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>
            {BOT_AVATAR}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{BOT_NAME}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              {isTyping ? 'ecrit...' : 'Assistant POS Mano Verde'}
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'none', border: 'none', color: C.white,
              cursor: 'pointer', padding: 4,
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* ── Messages ──────────────────────────────────────────────────── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: C.whatsappChatBg,
          padding: '12px 16px',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23c7bfad\' fill-opacity=\'0.15\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'3\'/%3E%3Ccircle cx=\'80\' cy=\'60\' r=\'2\'/%3E%3Ccircle cx=\'140\' cy=\'30\' r=\'3\'/%3E%3Ccircle cx=\'50\' cy=\'120\' r=\'2\'/%3E%3Ccircle cx=\'170\' cy=\'150\' r=\'3\'/%3E%3Ccircle cx=\'100\' cy=\'180\' r=\'2\'/%3E%3C/g%3E%3C/svg%3E")',
        }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 8,
              }}
            >
              <div style={{
                maxWidth: '85%',
                backgroundColor: msg.role === 'user' ? C.userBubble : C.botBubble,
                borderRadius: 8,
                borderTopLeftRadius: msg.role === 'assistant' ? 0 : 8,
                borderTopRightRadius: msg.role === 'user' ? 0 : 8,
                padding: '8px 12px',
                boxShadow: '0 1px 1px rgba(0,0,0,0.08)',
                position: 'relative',
              }}>
                {msg.isAudio && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Volume2 size={16} color="#128C7E" />
                    <div style={{
                      flex: 1, height: 4, backgroundColor: '#128C7E', borderRadius: 2, opacity: 0.4,
                    }} />
                  </div>
                )}
                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.45,
                    color: C.textDark,
                    wordBreak: 'break-word',
                  }}
                  dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                />
                <div style={{
                  fontSize: 11,
                  color: C.textLight,
                  textAlign: 'right',
                  marginTop: 2,
                }}>
                  {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
              <div style={{
                backgroundColor: C.botBubble, borderRadius: 8, borderTopLeftRadius: 0,
                padding: '10px 16px', boxShadow: '0 1px 1px rgba(0,0,0,0.08)',
              }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: '50%',
                      backgroundColor: '#90a4ae',
                      animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Suggestions ───────────────────────────────────────────────── */}
        {showSuggestions.length > 0 && (
          <div style={{
            backgroundColor: C.inputBg,
            padding: '8px 12px',
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            flexShrink: 0,
          }}>
            {showSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                style={{
                  backgroundColor: C.white,
                  border: `1px solid ${C.whatsappGreen}`,
                  borderRadius: 16,
                  padding: '6px 14px',
                  fontSize: 13,
                  color: C.whatsappDark,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  fontWeight: 500,
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8f5e9' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.white }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* ── Input ─────────────────────────────────────────────────────── */}
        <div style={{
          backgroundColor: C.inputBg,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
          paddingBottom: isMobile ? 'max(8px, env(safe-area-inset-bottom))' : 8,
        }}>
          <button
            onClick={toggleRecording}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: isRecording ? '#ef4444' : C.textLight,
              padding: 4, display: 'flex', alignItems: 'center',
            }}
            title={isRecording ? 'Arreter' : 'Enregistrer un audio'}
          >
            {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder="Ecrivez un message..."
            style={{
              flex: 1,
              border: 'none',
              borderRadius: 20,
              padding: '10px 16px',
              fontSize: 14,
              backgroundColor: C.white,
              outline: 'none',
              color: C.textDark,
            }}
            disabled={isRecording}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isRecording}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: input.trim() ? C.whatsappGreen : C.textLight,
              padding: 4, display: 'flex', alignItems: 'center',
              opacity: input.trim() ? 1 : 0.5,
            }}
          >
            <Send size={22} />
          </button>
        </div>
      </div>

      {/* ── CSS Animations ───────────────────────────────────────────────── */}
      <style>{`
        @keyframes dotBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  )
}

export default ChatWidget

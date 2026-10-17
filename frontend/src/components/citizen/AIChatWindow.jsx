import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  History,
  Loader2,
  MapPin,
  Plus,
  RotateCcw,
  Sparkles,
  SquarePen,
  Trash2,
} from 'lucide-react'

import { citizenUser } from '../../data/citizenMock'
import {
  confirmComplaint,
  deleteChatSession,
  fetchChatSessionDetail,
  fetchChatSessions,
  sendChatMessage,
} from '../../services/chatApi'
import Button from '../ui/Button'
import Logo from '../ui/Logo'
import ChatComposer from './ChatComposer'
import LocationPickerModal from './LocationPickerModal'

function formatSessionDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const suggestions = [
  'Ada jalan berlubang di Jalan Pantai Baharu',
  'Lampu jalan padam di simpang taman perumahan',
  'Longkang tersumbat dan air bertakung',
  'Sampah tidak dikutip sejak minggu lepas',
  'Bagaimanakah WaKiL berfungsi?',
]

const firstName = citizenUser.name.split(' ')[0]

function Assistant({ children }) {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white shadow-sm"
      >
        W
      </span>
      <div className="min-w-0 flex-1 space-y-3 text-[15px] leading-relaxed text-ink">{children}</div>
    </div>
  )
}

function TypingDots() {
  return (
    <Assistant>
      <div role="status" aria-label="WaKiL AI sedang menaip" className="flex items-center gap-2 py-2 text-muted text-sm">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              aria-hidden="true"
              className="typing-dot h-2 w-2 rounded-full bg-muted"
              style={{ '--d': `${i * 160}ms` }}
            />
          ))}
        </div>
        <span className="text-xs">WaKiL AI is thinking...</span>
      </div>
    </Assistant>
  )
}

export default function AIChatWindow() {
  const location = useLocation()
  const [flow, setFlow] = useState([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmedTicket, setConfirmedTicket] = useState(null)
  const [copied, setCopied] = useState(false)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [pinnedLocation, setPinnedLocation] = useState(null)
  const [attachedImage, setAttachedImage] = useState(null)
  const lastImageRef = useRef(null)

  const [sessions, setSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const inputRef = useRef(null)
  const scrollRef = useRef(null)
  const initialHandled = useRef(false)

  const loadSessions = useCallback(async () => {
    try {
      setLoadingSessions(true)
      const data = await fetchChatSessions()
      setSessions(data)
    } catch (err) {
      console.error('Failed to load chat sessions:', err)
    } finally {
      setLoadingSessions(false)
    }
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const handleMapConfirm = ({ formatted }) => {
    setPinnedLocation(formatted)
    send(`Lokasi kejadian: ${formatted}`)
  }

  const empty = flow.length === 0 && !loading

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? 'auto' : 'smooth' })
  }, [flow, loading, confirming])

  const sessionIdRef = useRef(sessionId)
  sessionIdRef.current = sessionId

  const send = useCallback(
    async (rawText, rawImage) => {
      const text = (rawText ?? input).trim()
      const img = rawImage ?? attachedImage
      if ((!text && !img) || loading || confirming) return

      const displayText = text || (img ? 'Attached photo evidence' : '')

      const userMsg = {
        id: `u-${Date.now()}`,
        type: 'user',
        text: displayText,
        image: img,
        timestamp: new Date(),
      }

      if (img) {
        lastImageRef.current = img
      }

      setFlow((prev) => [...prev, userMsg])
      setInput('')
      setAttachedImage(null)
      setLoading(true)

      try {
        const data = await sendChatMessage(displayText, sessionIdRef.current, img)
        if (data.session_id) {
          setSessionId(data.session_id)
          loadSessions()
        }

        setFlow((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            type: 'ai',
            text: data.reply,
            can_confirm: Boolean(data.can_confirm),
            sessionId: data.session_id,
            timestamp: new Date(),
          },
        ])
      } catch (err) {
        setFlow((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            type: 'error',
            text: err.message || 'Unable to communicate with WaKiL AI. Please check that the backend server is running.',
            retryText: text,
          },
        ])
      } finally {
        setLoading(false)
        inputRef.current?.focus()
      }
    },
    [input, attachedImage, loading, confirming, loadSessions],
  )

  // Handle incoming initial message from navigation state (e.g. from Dashboard search or quick chips)
  useEffect(() => {
    if (initialHandled.current) return
    const initMsg = location.state?.initialMessage
    if (initMsg && typeof initMsg === 'string' && initMsg.trim()) {
      initialHandled.current = true
      send(initMsg.trim())
    }
  }, [location.state, send])

  const reset = () => {
    setFlow([])
    setInput('')
    setSessionId(null)
    setLoading(false)
    setConfirming(false)
    setConfirmedTicket(null)
    setCopied(false)
    setPinnedLocation(null)
    setAttachedImage(null)
    lastImageRef.current = null
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  const handleSelectSession = async (sId) => {
    if (sId === sessionId) return
    setLoading(true)
    try {
      const detail = await fetchChatSessionDetail(sId)
      setSessionId(detail.id)
      const loadedFlow = detail.messages.map((m) => ({
        id: m.id,
        type: m.role === 'assistant' ? 'ai' : 'user',
        text: m.content,
        image: m.image_url,
        timestamp: new Date(m.created_at),
        can_confirm: detail.can_confirm,
      }))

      if (detail.complaint_ticket_id) {
        loadedFlow.push({
          id: `ticket-${detail.complaint_ticket_id}`,
          type: 'success',
          ticket_id: detail.complaint_ticket_id,
          status: detail.complaint_status || 'Pending',
          parliament: detail.parliament,
          dun: detail.dun,
          timestamp: new Date(detail.ended_at || detail.started_at),
        })
        setConfirmedTicket({
          ticket_id: detail.complaint_ticket_id,
          status: detail.complaint_status,
          parliament: detail.parliament,
          dun: detail.dun,
        })
      } else {
        setConfirmedTicket(null)
      }

      setFlow(loadedFlow)
    } catch (err) {
      alert(`Failed to load conversation: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSession = async (e, sId) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this conversation?')) return
    try {
      await deleteChatSession(sId)
      setSessions((prev) => prev.filter((s) => s.id !== sId))
      if (sId === sessionId) {
        reset()
      }
    } catch (err) {
      alert(`Failed to delete conversation: ${err.message}`)
    }
  }

  const handleConfirm = async () => {
    if (!sessionId || confirming) return

    setConfirming(true)
    try {
      const result = await confirmComplaint(sessionId, pinnedLocation, lastImageRef.current)
      setConfirmedTicket(result)
      loadSessions()
      setFlow((prev) => [
        ...prev,
        {
          id: `success-${Date.now()}`,
          type: 'success',
          ticket_id: result.ticket_id,
          status: result.status,
          parliament: result.parliament,
          dun: result.dun,
          image_url: result.image_url || lastImageRef.current,
          timestamp: new Date(),
        },
      ])
    } catch (err) {
      setFlow((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          type: 'error',
          text: `Confirmation failed: ${err.message}`,
        },
      ])
    } finally {
      setConfirming(false)
    }
  }

  const copyTicketId = (ticketId) => {
    if (!ticketId) return
    navigator.clipboard.writeText(ticketId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Check if the latest message can be confirmed and hasn't been confirmed yet
  const lastAiMessage = [...flow].reverse().find((m) => m.type === 'ai')
  const canConfirmLatest = Boolean(lastAiMessage?.can_confirm && !confirmedTicket)

  return (
    <div className="flex h-dvh flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line/60 px-3 sm:px-5">
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/citizen/dashboard"
            aria-label="Back to dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            title={sidebarOpen ? 'Hide conversation history' : 'Show conversation history'}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-canvas/40 px-2.5 py-1.5 text-xs font-semibold text-ink transition hover:bg-canvas hover:border-brand"
          >
            <History className="h-4 w-4 text-brand" />
            <span className="hidden sm:inline">History</span>
            {sessions.length > 0 && (
              <span className="rounded-full bg-brand-soft px-1.5 py-0.2 text-[10px] font-bold text-brand">
                {sessions.length}
              </span>
            )}
          </button>
          <Logo to="/citizen/dashboard" className="h-9 ml-1" />
          <span className="ml-2 hidden rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand md:inline-block">
            Connected to WaKiL Core
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          <SquarePen className="h-4 w-4" aria-hidden="true" />
          New chat
        </Button>
      </header>

      {/* Main Workspace with History Sidebar */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Collapsible Left Sidebar: Chat History */}
        {sidebarOpen && (
          <aside className="w-64 sm:w-72 shrink-0 border-r border-line/60 bg-canvas/30 flex flex-col min-h-0 transition-all">
            <div className="flex items-center justify-between border-b border-line/40 p-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-brand" />
                Chat History
              </span>
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1 text-xs font-bold text-brand hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                New
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingSessions ? (
                <div className="flex items-center justify-center p-6 text-xs text-muted">
                  <Loader2 className="h-4 w-4 animate-spin mr-2 text-brand" />
                  Loading history...
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted">
                  No conversation history yet. Start asking WaKiL AI!
                </div>
              ) : (
                sessions.map((s) => {
                  const isSelected = s.id === sessionId
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSession(s.id)}
                      className={`group relative flex cursor-pointer items-start justify-between rounded-xl p-2.5 text-left transition ${
                        isSelected
                          ? 'bg-brand-soft/80 border border-brand/30 text-ink shadow-xs'
                          : 'hover:bg-canvas text-ink/80 hover:text-ink'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className={`text-xs font-semibold truncate ${isSelected ? 'text-brand-dark font-bold' : ''}`}>
                          {s.title || 'Conversation'}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                          <span>{formatSessionDate(s.started_at)}</span>
                          {s.complaint_ticket_id ? (
                            <span className="rounded bg-mint-soft px-1.5 py-0.2 text-[9px] font-bold text-mint-dark">
                              {s.complaint_ticket_id}
                            </span>
                          ) : (
                            <span>· {s.message_count} msgs</span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(e, s.id)}
                        title="Delete conversation"
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-rose-600 transition rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </aside>
        )}

        <main className="flex min-h-0 flex-1 flex-col">
          <h1 className="sr-only">WaKiL AI</h1>

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 pb-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand shadow-sm">
              <Sparkles className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Hi, {firstName}. How can I assist you today?
            </h2>
            <p className="mt-2 max-w-lg text-sm text-muted">
              I can assist you in filing complaints to your MP or ADUN, detailing incidents, and answering questions about
              the WaKiL civic service.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-2xl">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-line bg-canvas/40 px-4 py-2 text-sm font-medium text-ink transition hover:border-brand hover:bg-brand-soft hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            aria-label="Conversation"
            tabIndex={0}
            className="min-h-0 flex-1 overflow-y-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
          >
            <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
              {flow.map((msg, index) => {
                const isLastAi = msg.type === 'ai' && index === flow.findLastIndex((m) => m.type === 'ai')

                return (
                  <div key={msg.id || index}>
                    {msg.type === 'user' && (
                      <div className="ml-auto w-fit max-w-[85%] rounded-3xl bg-brand px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-sm space-y-2">
                        {msg.image && (
                          <img
                            src={msg.image}
                            alt="Uploaded evidence"
                            className="max-h-56 max-w-full rounded-2xl object-cover border border-white/20 shadow-sm"
                          />
                        )}
                        {msg.text && <div className="whitespace-pre-wrap">{msg.text}</div>}
                      </div>
                    )}

                    {msg.type === 'ai' && (
                      <Assistant>
                        <div className="whitespace-pre-wrap">{msg.text}</div>

                        {/* If this message indicates ready to confirm */}
                        {msg.can_confirm && !confirmedTicket && isLastAi && (
                          <div className="mt-4 rounded-2xl border-2 border-brand/30 bg-brand-soft/50 p-4 transition">
                            <div className="flex items-start gap-3">
                              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                              <div className="flex-1">
                                <h3 className="text-sm font-bold text-ink">
                                  All details collected & ready for confirmation
                                </h3>
                                <p className="mt-1 text-xs text-muted">
                                  Please review the summary above. When you are ready, press the Confirm button below
                                  to submit your official complaint.
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Button
                                    onClick={handleConfirm}
                                    disabled={confirming}
                                    variant="primary"
                                    size="sm"
                                    className="gap-2"
                                  >
                                    {confirming ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Submitting ticket...
                                      </>
                                    ) : (
                                      <>
                                        <Check className="h-4 w-4" />
                                        Confirm & Submit Complaint
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Assistant>
                    )}

                    {msg.type === 'success' && (
                      <Assistant>
                        <div className="max-w-lg space-y-3 rounded-2xl border border-mint/40 bg-mint-soft p-5 text-sm shadow-sm">
                          <div className="flex items-center gap-2 font-bold text-mint-dark">
                            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                            <span>Complaint Successfully Registered!</span>
                          </div>
                          <p className="text-xs text-ink/80 leading-relaxed">
                            Your complaint has been verified and an official ticket has been filed with your wakil rakyat&apos;s
                            office. Our automated duplicate checks and triage classification have been completed.
                          </p>

                          <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-line">
                            <div>
                              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                                Official Ticket ID
                              </div>
                              <div className="text-base font-extrabold text-ink font-mono">{msg.ticket_id}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyTicketId(msg.ticket_id)}
                              className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-canvas transition"
                            >
                              {copied ? <Check className="h-3.5 w-3.5 text-mint-dark" /> : <Copy className="h-3.5 w-3.5" />}
                              {copied ? 'Copied' : 'Copy ID'}
                            </button>
                          </div>

                          {msg.parliament && (
                            <div className="rounded-xl bg-white/70 px-3 py-2 border border-mint/30 text-xs flex flex-wrap items-center justify-between gap-1">
                              <span className="font-semibold text-ink/70">Constituency:</span>
                              <span className="font-bold text-ink">
                                {msg.parliament}{msg.dun ? ` • ${msg.dun}` : ''}
                              </span>
                            </div>
                          )}

                          {msg.image_url && (
                            <div className="flex items-center gap-2.5 rounded-xl bg-white/70 p-2 border border-mint/30">
                              <img
                                src={msg.image_url}
                                alt="Complaint evidence"
                                className="h-12 w-12 rounded-lg object-cover border border-line"
                              />
                              <div className="text-xs">
                                <span className="font-semibold text-ink">Photo attached</span>
                                <p className="text-[11px] text-muted">Stored in official record</p>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Button as={Link} to="/citizen/aduan-saya" size="sm" className="gap-1.5">
                              View in My Complaints
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={reset}>
                              Start New Complaint
                            </Button>
                          </div>
                        </div>
                      </Assistant>
                    )}

                    {msg.type === 'error' && (
                      <Assistant>
                        <div className="max-w-lg rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 space-y-2">
                          <div className="flex items-center gap-2 font-semibold">
                            <AlertCircle className="h-4 w-4 text-rose-600" />
                            <span>Error Encountered</span>
                          </div>
                          <p className="text-xs text-rose-800 leading-relaxed">{msg.text}</p>
                          {msg.retryText && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => send(msg.retryText)}
                              className="!text-rose-900 hover:!bg-rose-100 !px-3 gap-1.5"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Retry
                            </Button>
                          )}
                        </div>
                      </Assistant>
                    )}
                  </div>
                )
              })}

              {loading && <TypingDots />}
            </div>
          </div>
        )}

        <div className="mx-auto w-full max-w-3xl px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {canConfirmLatest && !empty && (
            <div className="mb-3 flex items-center justify-between rounded-2xl border border-brand/30 bg-brand-soft/70 px-4 py-2 text-xs">
              <span className="font-medium text-brand-dark">
                Details complete. Ready to generate your official ticket.
              </span>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
                className="font-bold text-brand hover:underline disabled:opacity-50"
              >
                {confirming ? 'Submitting...' : 'Confirm Now →'}
              </button>
            </div>
          )}

          <div className="mb-2 flex items-center justify-between px-1 text-xs">
            <button
              type="button"
              onClick={() => setIsMapModalOpen(true)}
              className="flex items-center gap-1.5 font-semibold text-brand transition hover:underline"
            >
              <MapPin className="h-3.5 w-3.5 text-accent" />
              <span>Pin location / Use current GPS</span>
            </button>
            {pinnedLocation && (
              <span
                title={pinnedLocation}
                className="font-mono text-[11px] text-mint-dark bg-mint-soft px-2.5 py-0.5 rounded-full truncate max-w-[200px] sm:max-w-[300px] font-semibold flex items-center gap-1"
              >
                <span>GPS:</span>
                <span className="truncate">{pinnedLocation}</span>
              </span>
            )}
          </div>

          <ChatComposer
            value={input}
            onChange={setInput}
            onSend={() => send()}
            inputRef={inputRef}
            disabled={loading || confirming}
            onOpenLocationModal={() => setIsMapModalOpen(true)}
            attachedImage={attachedImage}
            onAttachedImageChange={setAttachedImage}
          />

          <p className="mt-3 text-center text-xs text-muted">
            WaKiL AI processes complaints directly through the WaKiL backend service with automated intake verification.
          </p>
        </div>
      </main>
      </div>

      {/* Interactive Map Picker Modal */}
      <LocationPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={handleMapConfirm}
      />
    </div>
  )
}

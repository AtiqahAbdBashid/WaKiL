import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import {
  confirmComplaint,
  deleteChatSession,
  fetchChatSessionDetail,
  fetchChatSessions,
  sendChatMessage,
} from '../../services/chatApi'
import ChatEmptyState from './chat/ChatEmptyState'
import ChatHeader from './chat/ChatHeader'
import ChatHistorySidebar from './chat/ChatHistorySidebar'
import ChatInputArea from './chat/ChatInputArea'
import ChatMessage from './chat/ChatMessage'
import TypingDots from './chat/TypingDots'
import LocationPickerModal from './LocationPickerModal'

export default function AIChatWindow() {
  const location = useLocation()
  const [flow, setFlow] = useState([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmedTicket, setConfirmedTicket] = useState(null)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [pinnedLocation, setPinnedLocation] = useState(null)
  const [attachedImage, setAttachedImage] = useState(null)
  const lastImageRef = useRef(null)

  const [sessions, setSessions] = useState([])
  const [historyNotice, setHistoryNotice] = useState('')
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
    send(`Incident location: ${formatted}`)
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
      setHistoryNotice(`Failed to load conversation: ${err.message}`)
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
      setHistoryNotice(`Failed to delete conversation: ${err.message}`)
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

  // Check if the latest message can be confirmed and hasn't been confirmed yet
  const lastAiMessage = [...flow].reverse().find((m) => m.type === 'ai')
  const canConfirmLatest = Boolean(lastAiMessage?.can_confirm && !confirmedTicket)

  return (
    <div className="flex h-dvh flex-col bg-white">
      <ChatHeader
        sidebarOpen={sidebarOpen}
        sessionCount={sessions.length}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onNewChat={reset}
      />

      {/* Main Workspace with History Sidebar */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Collapsible Left Sidebar: Chat History */}
        {sidebarOpen && (
          <ChatHistorySidebar
            sessions={sessions}
            loadingSessions={loadingSessions}
            sessionId={sessionId}
            notice={historyNotice}
            onDismissNotice={() => setHistoryNotice('')}
            onSelect={handleSelectSession}
            onDelete={handleDeleteSession}
            onNew={reset}
          />
        )}

        <main className="flex min-h-0 flex-1 flex-col">
          <h1 className="sr-only">WaKiL AI</h1>

        {empty ? (
          <ChatEmptyState onPick={send} />
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
                  <ChatMessage
                    key={msg.id || index}
                    msg={msg}
                    isLastAi={isLastAi}
                    confirmedTicket={confirmedTicket}
                    confirming={confirming}
                    onConfirm={handleConfirm}
                    onRetry={send}
                    onNewChat={reset}
                  />
                )
              })}

              {loading && <TypingDots />}
            </div>
          </div>
        )}

        <ChatInputArea
          showConfirmBanner={canConfirmLatest && !empty}
          confirming={confirming}
          onConfirm={handleConfirm}
          pinnedLocation={pinnedLocation}
          onOpenMap={() => setIsMapModalOpen(true)}
          input={input}
          onInputChange={setInput}
          onSend={() => send()}
          inputRef={inputRef}
          disabled={loading || confirming}
          attachedImage={attachedImage}
          onAttachedImageChange={setAttachedImage}
        />
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

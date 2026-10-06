import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Sparkles, SquarePen } from 'lucide-react'

import { citizenUser } from '../../data/citizenMock'
import Button from '../ui/Button'
import Logo from '../ui/Logo'
import ChatComposer from './ChatComposer'

const suggestions = [
  'Submit a new complaint',
  'Check complaint status',
  'Ask a question',
  'Usage guide',
]

const issueOptions = [
  'Pothole / damaged road',
  'Street light not working',
  'Blocked drain',
  'Uncollected rubbish',
  'Other issue',
]

// TODO: replace scripted replies with the real WaKiL AI service
const replies = {
  complaint: 'Sure, I can help you record a complaint. What issue would you like to report?',
  status:
    'Every complaint you have submitted, with its status and progress, is listed in My Complaints. Or type your question below.',
  question: 'Of course. Ask me anything about your complaints or local services in the box below.',
  guide:
    'Pick "Submit a new complaint" to report an issue, then follow its progress in My Complaints. You can also just describe the problem below.',
  freeText:
    'Thanks for your message. I can help record this report or share information about your Service Centre area. Pick a quick option above or give me a detailed location.',
}

const scripted = {
  'submit a new complaint': { text: replies.complaint, options: issueOptions },
  'check complaint status': { text: replies.status, action: 'complaints' },
  'ask a question': { text: replies.question },
  'usage guide': { text: replies.guide },
}

const firstName = citizenUser.name.split(' ')[0]

function Assistant({ children }) {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white"
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
      <div role="status" aria-label="WaKiL AI is typing" className="flex gap-1.5 py-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden="true"
            className="typing-dot h-2 w-2 rounded-full bg-muted"
            style={{ '--d': `${i * 160}ms` }}
          />
        ))}
      </div>
    </Assistant>
  )
}

export default function AIChatWindow() {
  const [flow, setFlow] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const inputRef = useRef(null)
  const scrollRef = useRef(null)
  const timers = useRef([])

  const empty = flow.length === 0 && !typing

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? 'auto' : 'smooth' })
  }, [flow, typing])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const push = (msg) => setFlow((prev) => [...prev, msg])

  const reply = (msg, ms = 700) => {
    setTyping(true)
    timers.current.push(
      setTimeout(() => {
        setTyping(false)
        push(msg)
      }, ms),
    )
  }

  const reset = () => {
    timers.current.forEach(clearTimeout)
    setFlow([])
    setInput('')
    setTyping(false)
    inputRef.current?.focus()
  }

  const send = (raw = input) => {
    const text = raw.trim()
    if (!text) return
    push({ type: 'user', text })
    setInput('')
    reply({ type: 'ai', ...(scripted[text.toLowerCase()] ?? { text: replies.freeText }) })
  }

  const pickIssue = (category) => {
    push({ type: 'user', text: category })
    reply({ type: 'form', category })
  }

  const submitComplaint = (e, category) => {
    e.preventDefault()
    const location = new FormData(e.currentTarget).get('location')
    push({ type: 'user', text: `Submit complaint: ${location}` })
    reply({ type: 'success', category, location }, 900)
  }

  return (
    <div className="flex h-dvh flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between px-3 sm:px-5">
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/citizen/dashboard"
            aria-label="Back to dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Logo to="/citizen/dashboard" className="h-9" />
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          <SquarePen className="h-4 w-4" aria-hidden="true" />
          New chat
        </Button>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <h1 className="sr-only">WaKiL AI</h1>

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-end px-4 pb-6 text-center">
            <Sparkles className="h-8 w-8 text-brand" aria-hidden="true" />
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Hi, {firstName}. How can I help today?
            </h2>
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
              {flow.map((msg, i) => (
                <div key={i}>
                  {msg.type === 'user' && (
                    <p className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap rounded-3xl bg-line/70 px-4 py-2.5 text-[15px] leading-relaxed text-ink">
                      {msg.text}
                    </p>
                  )}

                  {msg.type === 'ai' && (
                    <Assistant>
                      <p>{msg.text}</p>
                      {msg.options && (
                        <div className="flex flex-wrap gap-2">
                          {msg.options.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => pickIssue(opt)}
                              className="rounded-full border border-line px-4 py-2 text-sm font-medium text-brand transition hover:border-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand"
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                      {msg.action === 'complaints' && (
                        <Button as={Link} to="/citizen/aduan-saya" size="sm">
                          Go to My Complaints
                        </Button>
                      )}
                    </Assistant>
                  )}

                  {msg.type === 'form' && (
                    <Assistant>
                      <form
                        onSubmit={(e) => submitComplaint(e, msg.category)}
                        className="max-w-md space-y-3 rounded-2xl border border-line p-4"
                      >
                        <h3 className="text-sm font-bold">Complaint details ({msg.category})</h3>
                        <label className="block text-xs font-semibold text-muted">
                          Incident location
                          <input
                            name="location"
                            required
                            defaultValue="Jalan Pantai Baru, Bangsar"
                            className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm font-normal text-ink focus:border-brand focus:outline-2 focus:outline-brand/30"
                          />
                        </label>
                        <label className="block text-xs font-semibold text-muted">
                          Brief description
                          <textarea
                            rows={2}
                            placeholder="Describe the situation..."
                            className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm font-normal text-ink placeholder:text-muted focus:border-brand focus:outline-2 focus:outline-brand/30"
                          />
                        </label>
                        <Button type="submit" className="w-full">
                          Submit complaint
                        </Button>
                      </form>
                    </Assistant>
                  )}

                  {msg.type === 'success' && (
                    <Assistant>
                      <div className="max-w-md space-y-2 rounded-2xl bg-mint-soft p-4 text-sm">
                        <p className="flex items-center gap-2 font-bold text-mint-dark">
                          <Check className="h-4 w-4" aria-hidden="true" />
                          Complaint submitted
                        </p>
                        <p className="text-xs text-muted">
                          Your report has been recorded. A service officer will review it and contact you within 24
                          hours.
                        </p>
                        {/* TODO: real complaint id from the API */}
                        <p className="text-xs">
                          <strong>Sample ID:</strong> #WKL-2026-8891 · <strong>Category:</strong> {msg.category} ·{' '}
                          <strong>Location:</strong> {msg.location}
                        </p>
                      </div>
                    </Assistant>
                  )}
                </div>
              ))}
              {typing && <TypingDots />}
            </div>
          </div>
        )}

        <div className="mx-auto w-full max-w-3xl px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <ChatComposer value={input} onChange={setInput} onSend={() => send()} inputRef={inputRef} />
          {empty && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <p className="mt-3 text-center text-xs text-muted">
            WaKiL AI can make mistakes. Replies are scripted samples for now.
          </p>
        </div>
        {empty && <div className="flex-1" />}
      </main>
    </div>
  )
}

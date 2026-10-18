import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, CheckCircle2, Copy, ExternalLink } from 'lucide-react'
import Button from '../../ui/Button'

// Shown in the conversation once a complaint is filed (also when reopening a finished chat).
export default function TicketCard({ msg, onNewChat }) {
  const [copied, setCopied] = useState(false)

  const copyTicketId = (ticketId) => {
    if (!ticketId) return
    navigator.clipboard.writeText(ticketId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
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
        <Button variant="ghost" size="sm" onClick={onNewChat}>
          Start New Complaint
        </Button>
      </div>
    </div>
  )
}

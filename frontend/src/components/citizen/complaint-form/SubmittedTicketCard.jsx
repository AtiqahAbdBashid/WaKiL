import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, CheckCircle2, Copy, ExternalLink } from 'lucide-react'
import { citizenUser } from '../../../data/citizenMock'
import Badge from '../../ui/Badge'
import Button from '../../ui/Button'

export default function SubmittedTicketCard({ submittedTicket, image, onReset }) {
  const [copied, setCopied] = useState(false)

  const copyTicketId = (id) => {
    if (!id) return
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
      <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        <div className="bg-gradient-to-br from-mint-dark to-mint p-8 text-white text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">
            Complaint Successfully Submitted!
          </h1>
          <p className="mt-2 text-sm text-white/90">
            Your official civic report has been received and logged for your
            representative&apos;s office.
          </p>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div className="rounded-2xl border border-line bg-canvas/40 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Official Ticket ID
                </p>
                <p className="mt-0.5 font-mono text-xl font-extrabold text-ink sm:text-2xl">
                  {submittedTicket.ticket_id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyTicketId(submittedTicket.ticket_id)}
                className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink shadow-sm transition hover:bg-canvas"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-mint-dark" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? 'Copied!' : 'Copy Ticket ID'}
              </button>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted">Status</dt>
                <dd className="mt-1">
                  <Badge tone="mint">{submittedTicket.status || 'Pending'}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Category</dt>
                <dd className="mt-1 font-semibold text-ink">
                  {submittedTicket.category}
                </dd>
                {submittedTicket.categories?.length > 1 && (
                  <dd className="mt-2 flex flex-wrap gap-1.5">
                    {submittedTicket.categories.slice(1).map((category) => (
                      <span key={category} className="rounded-full border border-brand/20 bg-brand-soft/40 px-2 py-0.5 text-xs font-medium text-brand">
                        #{category.replaceAll(' ', '')}
                      </span>
                    ))}
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-xs text-muted">Priority</dt>
                <dd className="mt-1 font-semibold text-ink">
                  {submittedTicket.priority}
                </dd>
              </div>
              {submittedTicket.parliament && (
                <div>
                  <dt className="text-xs text-muted">Parliament</dt>
                  <dd className="mt-1 font-semibold text-ink">
                    {submittedTicket.parliament}
                  </dd>
                </div>
              )}
              {submittedTicket.dun && (
                <div>
                  <dt className="text-xs text-muted">DUN</dt>
                  <dd className="mt-1 font-semibold text-ink">
                    {submittedTicket.dun}
                  </dd>
                </div>
              )}
            </dl>

            {submittedTicket.manual_review_required && (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-5 text-amber-950">
                Your report was submitted and flagged for manual review because photo evidence was marked as {({ unavailable: 'unavailable', unsafe: 'unsafe to take', sensitive: 'sensitive', not_verifiable: 'not reasonably verifiable in a photo' })[submittedTicket.photo_exception_reason] || 'unavailable'}.
              </p>
            )}

            {(submittedTicket.image_url || image) && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-canvas/40 p-3">
                <img
                  src={submittedTicket.image_url || image}
                  alt="Incident evidence photo"
                  className="h-14 w-14 rounded-xl object-cover border border-line/60 shadow-sm"
                />
                <div className="text-xs">
                  <p className="font-semibold text-ink">Photo Evidence Attached</p>
                  <p className="text-muted mt-0.5">Stored in official SQL records & verified by Gemini AI.</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-2xl bg-brand-soft/40 p-4 text-xs leading-relaxed text-ink/80">
            <p className="font-semibold text-brand-dark">What happens next?</p>
            <ul className="list-inside list-disc space-y-1">
              <li>
                Your report has been assigned to the service team for{' '}
                <strong>
                  {submittedTicket.parliament
                    ? `${submittedTicket.parliament}${submittedTicket.dun ? ` (${submittedTicket.dun})` : ''}`
                    : citizenUser.area}
                </strong>.
              </li>
              <li>
                Automated duplicate triage and spatial clustering have recorded
                this incident.
              </li>
              <li>
                You can monitor status changes and progress milestones in{' '}
                <strong>My Complaints</strong>.
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
            <Button
              as={Link}
              to="/citizen/aduan-saya"
              variant="primary"
              size="lg"
              className="gap-2 justify-center"
            >
              Track in My Complaints
              <ExternalLink className="h-4 w-4" />
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="lg" onClick={onReset} className="flex-1 sm:flex-initial">
                Submit Another
              </Button>
              <Button
                as={Link}
                to="/citizen/dashboard"
                variant="ghost"
                size="lg"
                className="flex-1 sm:flex-initial"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

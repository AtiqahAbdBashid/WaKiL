import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Bell, CheckCircle2, ClipboardCheck, ClipboardList, Clock3, Loader2, RefreshCw } from 'lucide-react'

import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import PageTitle from '../../components/ui/PageTitle'
import { useCitizenNotifications } from '../../context/CitizenNotificationContext'

const filters = [
  { value: 'All', label: 'All' },
  { value: 'Submitted', label: 'Submitted' },
  { value: 'Status changed', label: 'Status changed' },
  { value: 'Resolved', label: 'Resolved' },
]

function formatDate(value) {
  if (!value) return 'Date unavailable'
  return new Intl.DateTimeFormat('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(value))
}

function iconFor(kind) {
  if (kind === 'Submitted') return ClipboardCheck
  if (kind === 'Resolved') return CheckCircle2
  return RefreshCw
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState('All')
  const [visibleLimit, setVisibleLimit] = useState(10)
  const hasMarkedSeen = useRef(false)
  const { notifications, loading, error, refresh, markAllRead } = useCitizenNotifications()
  const filteredNotifications = notifications.filter((item) => filter === 'All' || item.kind === filter)
  const shown = filteredNotifications.slice(0, visibleLimit)

  useEffect(() => {
    if (loading || error || hasMarkedSeen.current) return
    hasMarkedSeen.current = true
    markAllRead()
  }, [loading, error, markAllRead])

  return (
    <div className="w-full space-y-6">
      <PageTitle
        title="Notifications"
        subtitle="Updates about your submitted complaints."
        action={(
          <Button as={Link} to="/citizen/aduan-saya" variant="soft" size="sm">
            <ClipboardList className="h-4 w-4" /> My complaints
          </Button>
        )}
      />

      <section className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter notifications">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={filter === item.value}
                onClick={() => {
                  setFilter(item.value)
                  setVisibleLimit(10)
                }}
                className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${filter === item.value ? 'bg-brand text-white' : 'bg-canvas text-muted hover:bg-brand-soft hover:text-brand'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => refresh(true)}
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-brand hover:bg-brand-soft disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted">
          <Bell className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          Notifications include complaint submission and status changes. Staff notes and internal case activity are not shown here.
        </p>
      </section>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => refresh(true)} className="font-bold underline">Try again</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-line bg-white py-16 text-sm text-muted">
          <Loader2 className="h-5 w-5 animate-spin text-brand" /> Loading notifications...
        </div>
      ) : error ? null : shown.length ? (
        <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm" aria-label="Complaint notifications">
          <ul className="divide-y divide-line">
            {shown.map((item) => {
              const Icon = iconFor(item.kind)
              return (
                <li key={item.id} className="flex gap-3 p-4 sm:gap-4 sm:p-5">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.kind === 'Resolved' ? 'bg-mint-soft text-mint-dark' : 'bg-brand-soft text-brand'}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-ink">{item.heading}</h2>
                      <Badge
                        tone={item.status === 'Pending' ? 'warning' : item.status === 'In Progress' ? 'info' : undefined}
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-ink-soft">{item.message}</p>
                    <p className="mt-2 text-xs text-muted">
                      {item.title} · {item.category} · Ticket #{item.ticket}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                      <Clock3 className="h-3.5 w-3.5" /> {formatDate(item.at)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
          {shown.length < filteredNotifications.length && (
            <div className="border-t border-line p-4 text-center">
              <button
                type="button"
                onClick={() => setVisibleLimit((limit) => limit + 10)}
                className="min-h-10 rounded-xl px-4 text-sm font-semibold text-brand transition hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand"
              >
                Load older notifications
              </button>
            </div>
          )}
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-white px-5 py-14 text-center">
          <Bell className="mx-auto h-9 w-9 text-muted/70" />
          <h2 className="mt-3 text-base font-bold text-ink">No notifications yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">
            When you submit a complaint or its status changes, the update will appear here.
          </p>
          <Button as={Link} to="/citizen/hantar-aduan" size="sm" className="mt-4">
            Submit a complaint
          </Button>
        </div>
      )}
    </div>
  )
}

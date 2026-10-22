import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, ChevronDown, ClipboardList, Loader2, Search, Sparkles } from 'lucide-react'

import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import PageTitle from '../../components/ui/PageTitle'
import { fetchMyComplaints } from '../../services/chatApi'

const filters = [
  { value: 'All', label: 'All complaints' },
  { value: 'Pending', label: 'Submitted' },
  { value: 'In Progress', label: 'In progress' },
  { value: 'Resolved', label: 'Resolved' },
]

function formatDate(value) {
  if (!value) return 'Update received'
  return new Intl.DateTimeFormat('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(value))
}

function shortId(id) {
  return id ? id.replaceAll('-', '').slice(0, 8).toUpperCase() : '—'
}

function ComplaintCard({ complaint, expanded, onToggle }) {
  const timeline = complaint.timeline || []

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className="w-full p-4 text-left transition hover:bg-canvas/60 focus-visible:outline-2 focus-visible:outline-brand sm:p-5"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="min-w-0 flex-1 text-base font-bold text-ink">{complaint.title}</h2>
              <Badge>{complaint.status}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted">Ticket #{shortId(complaint.id)} · Submitted {formatDate(complaint.created_at)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {(complaint.categories?.length ? complaint.categories : [complaint.category]).filter(Boolean).map((category, index) => (
                <span key={`${category}-${index}`} className={`rounded-full px-2.5 py-1 text-xs font-medium ${index === 0 ? 'bg-brand-soft text-brand' : 'border border-line bg-white text-muted'}`}>
                  {index === 0 ? category : `#${category.replaceAll(' ', '')}`}
                </span>
              ))}
              <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-brand">
                {expanded ? 'Hide progress' : 'View progress'}
                <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </span>
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-line bg-canvas/40 px-5 py-5 sm:pl-[4.5rem]">
          <h3 className="text-sm font-bold text-ink">Progress updates</h3>
          <ol className="mt-4 space-y-0">
            {timeline.map((event, index) => {
              const isCurrent = index === timeline.length - 1
              return (
                <li key={`${event.status}-${event.at || index}`} className="relative flex gap-3 pb-5 last:pb-0">
                  {index < timeline.length - 1 && <span className="absolute left-[0.4375rem] top-3 h-full w-px bg-line" aria-hidden="true" />}
                  <span className={`relative mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${isCurrent ? 'border-brand bg-brand ring-4 ring-brand/10' : 'border-mint-dark bg-white'}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{event.label}</p>
                    <p className="mt-0.5 text-xs text-muted">{formatDate(event.at)}</p>
                  </div>
                </li>
              )
            })}
          </ol>
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-brand/15 bg-white p-3 text-xs leading-5 text-muted">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            This timeline shows status changes for your complaint.
          </p>
        </div>
      )}
    </article>
  )
}

export default function MyComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const loadComplaints = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setComplaints(await fetchMyComplaints())
    } catch (err) {
      setError(err.message || 'We could not load your complaints. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let isCurrent = true
    fetchMyComplaints()
      .then((result) => {
        if (isCurrent) setComplaints(result)
      })
      .catch((err) => {
        if (isCurrent) setError(err.message || 'We could not load your complaints. Please try again.')
      })
      .finally(() => {
        if (isCurrent) setLoading(false)
      })
    return () => { isCurrent = false }
  }, [])

  const counts = useMemo(() => ({
    All: complaints.length,
    Pending: complaints.filter((item) => item.status === 'Pending').length,
    'In Progress': complaints.filter((item) => item.status === 'In Progress').length,
    Resolved: complaints.filter((item) => item.status === 'Resolved').length,
  }), [complaints])

  const visibleComplaints = useMemo(() => {
    const term = query.trim().toLowerCase()
    return complaints.filter((item) => {
      const matchesStatus = filter === 'All' || item.status === filter
      const matchesSearch = !term || [item.title, item.category, item.id, ...(item.categories || [])]
        .filter(Boolean).join(' ').toLowerCase().includes(term)
      return matchesStatus && matchesSearch
    })
  }, [complaints, filter, query])

  return (
    <div className="w-full space-y-6">
      <PageTitle
        title="My Complaints"
        subtitle="Track the status of reports you have submitted."
        action={(
          <Button as={Link} to="/citizen/hantar-aduan" size="sm" className="shrink-0">
            Submit a complaint <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      />

      <section className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5" aria-label="Filter complaints">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by complaint status">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                aria-pressed={filter === item.value}
                className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${filter === item.value ? 'bg-brand text-white' : 'bg-canvas text-muted hover:bg-brand-soft hover:text-brand'}`}
              >
                {item.label} <span className="ml-1 opacity-75">{counts[item.value]}</span>
              </button>
            ))}
          </div>
          <label className="relative block w-full lg:max-w-xs">
            <span className="sr-only">Search your complaints</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your complaints"
              className="w-full rounded-xl border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </label>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button type="button" onClick={loadComplaints} className="font-bold underline">Try again</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-line bg-white py-16 text-sm text-muted">
          <Loader2 className="h-5 w-5 animate-spin text-brand" /> Loading your complaints...
        </div>
      ) : error ? null : visibleComplaints.length ? (
        <div className="space-y-3">
          {visibleComplaints.map((complaint) => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              expanded={expandedId === complaint.id}
              onToggle={() => setExpandedId(expandedId === complaint.id ? null : complaint.id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-white px-5 py-14 text-center">
          <ClipboardList className="mx-auto h-9 w-9 text-muted/70" />
          <h2 className="mt-3 text-base font-bold text-ink">
            {complaints.length ? 'No complaints match this filter' : 'No complaints yet'}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">
            {complaints.length ? 'Try another status or search term.' : 'When you submit a complaint, its status and progress will appear here.'}
          </p>
          {!complaints.length && (
            <Button as={Link} to="/citizen/hantar-aduan" size="sm" className="mt-4">
              Submit your first complaint
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

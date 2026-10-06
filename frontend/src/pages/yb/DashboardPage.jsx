import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown, Clock, Lightbulb, Mail, MapPin, MoreHorizontal, Plus, Search, X } from 'lucide-react'

import PageColumns from '../../components/dashboard/PageColumns'
import HeatmapPreview from '../../components/yb/HeatmapPreview'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import CategoryTile from '../../components/ui/CategoryTile'
import { categoryBars, constituency, officers, ybComplaints } from '../../data/ybMock'

const statusTone = {
  New: 'accent',
  'In Review': 'neutral',
  'In Action': 'mint',
  Resolved: 'mint',
}

const categories = Object.keys(categoryBars)

function InsightCard({ tone, tag, icon: Icon, title, people, children }) {
  const bg =
    tone === 'accent'
      ? 'bg-gradient-to-br from-[#f0506e] to-[#f77a92] shadow-glow-accent'
      : 'bg-gradient-to-br from-brand-dark to-brand shadow-glow-brand'
  return (
    <section className={`relative overflow-hidden rounded-3xl p-6 text-white ${bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/25">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <Badge tone={tone === 'accent' ? 'onColor' : 'onColorDark'} caps>
            {tag}
          </Badge>
        </div>
        <MoreHorizontal className="h-5 w-5 text-white/80" aria-hidden="true" />
      </div>
      <h2 className="mt-5 max-w-[16rem] text-xl font-extrabold leading-snug">{title}</h2>
      <div className="mt-4 flex -space-x-2">
        {people.map((p) => (
          <Avatar key={p} initials={p} tone="neutral" size="sm" ring />
        ))}
      </div>
      {children}
    </section>
  )
}

export default function YbDashboardPage() {
  const [tab, setTab] = useState('open')
  const [query, setQuery] = useState('')
  const [assignId, setAssignId] = useState('0006')
  const [assignCategory, setAssignCategory] = useState('Roads')
  const [assignees, setAssignees] = useState(['Aina', 'Kumar'])
  const [assignedNote, setAssignedNote] = useState('')

  const resolvedCount = ybComplaints.filter((c) => c.status === 'Resolved').length
  const total = ybComplaints.length
  const openCount = total - resolvedCount
  const newCount = ybComplaints.filter((c) => c.status === 'New').length

  const visible = ybComplaints
    .filter((c) => (tab === 'open' ? c.status !== 'Resolved' : c.status === 'Resolved'))
    .filter((c) => `${c.title} ${c.area} ${c.category} #${c.id}`.toLowerCase().includes(query.toLowerCase()))
  const groups = ['This week', 'Earlier'].map((name) => ({
    name,
    items: visible.filter((c) => c.group === name),
  }))

  const categoryCounts = categories.map((name) => ({
    name,
    count: ybComplaints.filter((c) => c.category === name).length,
  }))
  const maxCount = Math.max(...categoryCounts.map((c) => c.count))

  const openComplaints = ybComplaints.filter((c) => c.status !== 'Resolved')
  const unassigned = officers.filter((o) => !assignees.includes(o.name))

  const submitAssign = (e) => {
    e.preventDefault()
    // TODO: send the assignment to the API
    setAssignedNote(
      assignees.length
        ? `Assigned #${assignId} (${assignCategory}) to ${assignees.join(', ')}. Sample data only.`
        : 'Pick at least one officer first.',
    )
  }

  const rail = (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">Complaint heatmap</h2>
        <Badge tone="neutral">Last 30 days</Badge>
      </div>
      <div className="mt-4">
        <HeatmapPreview />
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted">
        <span>Low</span>
        <span aria-hidden="true" className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-mint via-violet to-accent" />
        <span>High</span>
        <Link to="/yb/map" className="ml-2 text-sm font-semibold text-brand hover:underline">
          Open map ↗
        </Link>
      </div>

      <div className="mt-6 border-t border-line pt-6">
        <h2 className="text-lg font-bold text-ink">{constituency.name}</h2>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {constituency.note}
        </p>
        <dl className="mt-4 grid grid-cols-3 gap-2">
          <div>
            <dt className="text-xs text-muted">Resolved</dt>
            <dd className="text-3xl font-extrabold text-ink">
              {resolvedCount}
              <span aria-hidden="true" className="text-mint">
                .
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Open</dt>
            <dd className="text-3xl font-extrabold text-ink">
              {openCount}
              <span aria-hidden="true" className="text-accent">
                .
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Officers</dt>
            <dd className="mt-2 flex -space-x-2">
              {officers.slice(0, 3).map((o) => (
                <Avatar key={o.name} initials={o.initials} tone={o.tone} size="sm" ring />
              ))}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 border-t border-line pt-6">
        <h2 className="text-lg font-bold text-ink">Complaints by category</h2>
        <ul className="mt-4 space-y-3">
          {categoryCounts.map((c) => (
            <li key={c.name}>
              <div className="flex justify-between text-sm text-ink">
                <span>{c.name}</span>
                <span className="font-bold">{c.count}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
                <div
                  className={`h-full rounded-full ${categoryBars[c.name]}`}
                  style={{ width: `${(c.count / maxCount) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={submitAssign} className="mt-6 border-t border-line pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Quick Assign</h2>
          <MoreHorizontal className="h-5 w-5 text-muted" aria-hidden="true" />
        </div>

        <label htmlFor="assign-complaint" className="mt-4 block text-sm text-muted">
          Complaint
        </label>
        <div className="relative mt-1">
          <select
            id="assign-complaint"
            value={assignId}
            onChange={(e) => setAssignId(e.target.value)}
            className="w-full appearance-none rounded-2xl border border-line bg-white py-3 pl-4 pr-10 text-sm text-ink focus:border-brand focus:outline-2 focus:outline-brand/30"
          >
            {openComplaints.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.id} {c.title}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
        </div>

        <div role="group" aria-label="Category" className="mt-3 flex flex-wrap gap-2">
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={assignCategory === name}
              onClick={() => setAssignCategory(name)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                assignCategory === name ? 'bg-brand text-white' : 'bg-canvas text-ink hover:bg-line'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm text-muted" id="assign-to">
          Assign to
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2" aria-labelledby="assign-to" role="group">
          {assignees.map((name) => {
            const o = officers.find((x) => x.name === name)
            return (
              <span key={name} className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft py-1 pl-1 pr-2 text-sm font-medium text-brand">
                <Avatar initials={o.initials} tone={o.tone} size="sm" />
                {name}
                <button
                  type="button"
                  aria-label={`Remove ${name}`}
                  onClick={() => setAssignees((list) => list.filter((n) => n !== name))}
                  className="rounded-full p-0.5 hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            )
          })}
          <button
            type="button"
            aria-label="Add next officer"
            disabled={unassigned.length === 0}
            onClick={() => setAssignees((list) => [...list, unassigned[0].name])}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-muted text-muted hover:border-brand hover:text-brand disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-brand"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="submit"
            aria-label="Assign complaint"
            className="ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-glow-accent hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <p role="status" className="mt-3 min-h-5 text-sm text-mint-dark">
          {assignedNote}
        </p>
      </form>
    </>
  )

  return (
    <PageColumns rail={rail}>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Good morning, YB Office</h1>
        <div className="flex items-center gap-3 text-sm text-muted">
          <span>
            {resolvedCount} of {total} complaints resolved
          </span>
          <div
            role="progressbar"
            aria-label="Complaints resolved"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={resolvedCount}
            className="h-1.5 w-28 overflow-hidden rounded-full bg-line"
          >
            <div className="h-full rounded-full bg-accent" style={{ width: `${(resolvedCount / total) * 100}%` }} />
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <InsightCard
          tone="accent"
          tag="AI Insight"
          icon={Lightbulb}
          title="Street light reports clustering in Taman Sri Muda"
          people={['A', 'K', 'F']}
        />
        <InsightCard
          tone="violet"
          tag="Needs attention"
          icon={Mail}
          title={`${newCount} new complaints awaiting review`}
          people={['M', 'A', 'K']}
        >
          <span
            aria-hidden="true"
            className="absolute bottom-5 right-5 hidden h-24 w-24 items-center justify-center rounded-full bg-white/25 sm:flex"
          >
            <MapPin className="h-10 w-10 text-accent" />
          </span>
        </InsightCard>
      </div>

      <section aria-labelledby="complaints-heading" className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 id="complaints-heading" className="text-2xl font-extrabold text-ink">
              Complaints
            </h2>
            <Badge tone="neutral">Sample data</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              Archive
            </Button>
            <Button as={Link} to="/yb/complaints" size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-line">
          <div role="tablist" aria-label="Complaint status" className="flex gap-6">
            {[
              { id: 'open', label: 'Open' },
              { id: 'resolved', label: 'Resolved' },
            ].map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`-mb-px border-b-2 pb-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-brand ${
                  tab === t.id ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative mb-2 w-full sm:w-56">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search complaints"
              placeholder="Search complaints"
              className="w-full rounded-full bg-transparent py-2 pl-9 pr-3 text-sm placeholder:text-muted focus:bg-canvas focus:outline-2 focus:outline-brand/40"
            />
          </div>
        </div>

        <div role="tabpanel" className="mt-2">
          {visible.length === 0 && <p className="py-10 text-center text-sm text-muted">No complaints found.</p>}
          {groups
            .filter((g) => g.items.length > 0)
            .map((group) => (
              <div key={group.name}>
                <h3 className="mt-5 text-xs font-bold uppercase tracking-widest text-muted">{group.name}</h3>
                <ul>
                  {group.items.map((c) => (
                    <li
                      key={c.id}
                      className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 py-3.5 sm:grid-cols-[auto_1fr_auto]"
                    >
                      <CategoryTile category={c.category} />
                      <div className="min-w-0">
                        <p className="font-semibold leading-snug text-ink">{c.title}</p>
                        <p className="mt-0.5 text-sm text-muted">
                          #{c.id} · {c.area} · {c.category} · {c.date}
                        </p>
                      </div>
                      <Badge tone={statusTone[c.status]} className="col-start-2 justify-self-start sm:col-start-auto">
                        {c.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </section>
    </PageColumns>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, MessageCircle, Plus, Search, ShieldCheck } from 'lucide-react'

import PageColumns from '../../components/dashboard/PageColumns'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import CategoryTile from '../../components/ui/CategoryTile'
import ProgressBar from '../../components/ui/ProgressBar'
import {
  citizenComplaints,
  citizenRepresentative,
  citizenUpdates,
} from '../../data/citizenMock'

const statusTone = {
  'Under Review': 'accent',
  'In Progress': 'brand',
  Completed: 'mint',
}

const dotTone = { brand: 'bg-brand', accent: 'bg-accent', mint: 'bg-mint' }

const statTiles = [
  { label: 'Total', dot: null, count: (list) => list.length },
  { label: 'Under review', dot: 'bg-accent', count: (list) => list.filter((c) => c.status === 'Under Review').length },
  { label: 'In progress', dot: 'bg-brand', count: (list) => list.filter((c) => c.status === 'In Progress').length },
  { label: 'Completed', dot: 'bg-mint', count: (list) => list.filter((c) => c.status === 'Completed').length },
]

const quickChips = ['Submit a complaint', 'Check status', 'Guide']

function HeroCard({ tone, tag, icon: Icon, title, text, cta, to, children }) {
  const bg =
    tone === 'accent'
      ? 'bg-gradient-to-br from-[#f0506e] to-[#f77a92] shadow-glow-accent'
      : 'bg-gradient-to-br from-brand-dark to-brand shadow-glow-brand'
  return (
    <section className={`relative overflow-hidden rounded-3xl p-6 text-white ${bg} ${children ? 'sm:pr-36' : ''}`}>
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/25">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <Badge tone={tone === 'accent' ? 'onColor' : 'onColorDark'} caps>
          {tag}
        </Badge>
      </div>
      <h2 className="mt-4 text-2xl font-extrabold leading-tight">{title}</h2>
      <p className="mt-1 text-sm text-white/90">{text}</p>
      <Button as={Link} to={to} variant={tone === 'accent' ? 'onColor' : 'onColorSoft'} className="mt-5">
        {cta}
      </Button>
      {children}
    </section>
  )
}

export default function CitizenDashboardPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('active')
  const [query, setQuery] = useState('')
  const [question, setQuestion] = useState('')

  const visible = citizenComplaints
    .filter((c) => (tab === 'active' ? c.status !== 'Completed' : c.status === 'Completed'))
    .filter((c) => `${c.title} ${c.section} ${c.category} #${c.id}`.toLowerCase().includes(query.toLowerCase()))
  const groups = ['This week', 'Earlier'].map((name) => ({
    name,
    items: visible.filter((c) => c.group === name),
  }))

  const askAi = (e) => {
    e.preventDefault()
    if (!question.trim()) {
      navigate('/citizen/wakil-ai')
      return
    }
    navigate('/citizen/wakil-ai', { state: { initialMessage: question } })
  }


  const rail = (
    <>
      <h2 className="text-lg font-bold text-ink">My complaint status</h2>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        {statTiles.map((tile) => (
          <div key={tile.label} className="rounded-2xl border border-line bg-canvas/50 p-4">
            <dt className="flex items-center gap-2 text-sm text-muted">
              {tile.dot && <span aria-hidden="true" className={`h-2 w-2 rounded-full ${tile.dot}`} />}
              {tile.label}
            </dt>
            <dd className="mt-1 text-3xl font-extrabold text-ink">{tile.count(citizenComplaints)}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">Latest updates</h2>
        <Link to="/citizen/notifikasi" className="text-sm font-semibold text-brand hover:underline">
          See all
        </Link>
      </div>
      <ol className="mt-4 space-y-4">
        {citizenUpdates.map((u) => (
          <li key={u.text} className="flex gap-3">
            <span aria-hidden="true" className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${dotTone[u.tone]}`} />
            <div>
              <p className="text-sm font-medium leading-snug text-ink">{u.text}</p>
              <p className="mt-0.5 text-xs text-muted">{u.date}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex items-center gap-3 rounded-2xl border border-line bg-canvas/50 p-4">
        <Avatar initials={citizenRepresentative.initials} tone="neutral" size="lg" online />
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">{citizenRepresentative.name}</p>
          <p className="text-sm text-muted">{citizenRepresentative.role}</p>
          <Badge tone="brand" className="mt-1.5 !text-[11px]">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            Verified by MyDigital ID
          </Badge>
        </div>
      </div>

      <form onSubmit={askAi} className="mt-auto pt-10">
        <label htmlFor="ask-ai" className="text-sm font-bold text-ink">
          Ask WaKiL AI
        </label>
        <div className="relative mt-2">
          <input
            id="ask-ai"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about your complaints"
            className="w-full rounded-full bg-canvas py-3.5 pl-5 pr-14 text-sm placeholder:text-muted/80 focus:bg-white focus:outline-2 focus:outline-brand/40"
          />
          <button
            type="submit"
            aria-label="Send question"
            className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickChips.map((chip) => {
            const prompts = {
              'Submit a complaint': 'Saya ingin membuat aduan baharu',
              'Check status': 'Bagaimana cara semak status aduan saya?',
              Guide: 'Bagaimanakah sistem WaKiL berfungsi?',
            }
            return (
              <button
                key={chip}
                type="button"
                onClick={() =>
                  navigate('/citizen/wakil-ai', {
                    state: { initialMessage: prompts[chip] || chip },
                  })
                }
                className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
              >
                {chip}
              </button>
            )
          })}
        </div>
      </form>
    </>
  )

  return (
    <PageColumns rail={rail}>
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Hi, Ain</h1>
        <p className="mt-1 text-muted">What needs your attention today?</p>
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <HeroCard
          tone="accent"
          tag="Report an issue"
          icon={Plus}
          title="Submit a new complaint"
          text="Report an issue in 3 easy steps"
          cta="Start report"
          to="/citizen/hantar-aduan"
        />
        <HeroCard
          tone="brand"
          tag="Smart help"
          icon={MessageCircle}
          title="Chat with WaKiL AI"
          text="Get instant guidance"
          cta="Start chat"
          to="/citizen/wakil-ai"
        >
          {/* TODO: swap for the 3D chat illustration once the asset is supplied */}
          <span
            aria-hidden="true"
            className="absolute right-6 top-1/2 hidden h-24 w-24 -translate-y-1/2 items-center justify-center rounded-3xl bg-white/90 sm:flex"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#f0506e] to-[#f77a92] text-white shadow-glow-accent">
              <MessageCircle className="h-7 w-7" />
            </span>
          </span>
        </HeroCard>
      </div>

      <section aria-labelledby="my-complaints" className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 id="my-complaints" className="text-2xl font-extrabold text-ink">
              My Complaints
            </h2>
            <Badge tone="neutral">Sample data</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button as={Link} to="/citizen/aduan-saya" variant="ghost" size="sm">
              See all
            </Button>
            <Button as={Link} to="/citizen/hantar-aduan" size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-line">
          <div role="tablist" aria-label="Complaint status" className="flex gap-6">
            {[
              { id: 'active', label: 'Active' },
              { id: 'completed', label: 'Completed' },
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
                          #{c.id} · {c.section} · {c.category} · {c.date}
                        </p>
                        <ProgressBar
                          value={c.progress}
                          tone={statusTone[c.status] === 'accent' ? 'accent' : statusTone[c.status] === 'mint' ? 'mint' : 'brand'}
                          label={`Complaint ${c.id} progress`}
                          className="mt-2"
                        />
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

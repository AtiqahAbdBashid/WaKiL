import { ShieldCheck } from 'lucide-react'

import Badge from '../ui/Badge'
import CountUp from '../ui/CountUp'
import Reveal from '../ui/Reveal'
import SectionHeader from './SectionHeader'
import { categoryBars } from '../../data/ybMock'
import { pilotStats, transparencyPoints } from '../../data/landingContent'

const percent = (part, whole) => Math.round((part / whole) * 100)

export default function StatsSection() {
  const { received, resolved, avgFirstResponseDays, pilotAreas, categories } = pilotStats
  const maxCount = Math.max(...categories.map((c) => c.count))

  const tiles = [
    { label: 'Complaints received', value: received },
    { label: 'Complaints resolved', value: resolved, note: `${percent(resolved, received)}% of received` },
    { label: 'Days to first response', value: avgFirstResponseDays, note: 'Average' },
    { label: 'Active pilot areas', value: pilotAreas },
  ]

  return (
    <section
      id="statistics"
      aria-labelledby="statistics-title"
      className="border-y border-line bg-white px-4 py-20 sm:px-6 lg:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          id="statistics-title"
          eyebrow="Statistics & transparency"
          title="Open numbers, private people"
          badge={<Badge tone="neutral">Pilot · sample data</Badge>}
        >
          What WaKiL reports publicly is aggregated. The figures below are sample data for the pilot, not real
          complaints.
        </SectionHeader>

        <dl className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {tiles.map((tile, i) => (
            <Reveal
              key={tile.label}
              delay={i * 80}
              className="rounded-3xl border border-line bg-canvas/60 p-5 sm:p-6"
            >
              <dt className="text-sm font-medium text-muted">{tile.label}</dt>
              <dd className="mt-2 text-4xl font-extrabold tracking-tight text-ink">
                <CountUp value={tile.value} />
              </dd>
              {tile.note && <p className="mt-1 text-sm text-muted">{tile.note}</p>}
            </Reveal>
          ))}
        </dl>

        <div className="mt-5 grid gap-5 lg:grid-cols-5">
          <Reveal className="rounded-3xl border border-line p-6 sm:p-8 lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-bold text-ink">Complaints by category</h3>
              <span className="text-sm text-muted">Pilot · sample data</span>
            </div>
            <ul className="mt-6 space-y-5">
              {categories.map((c, i) => (
                <li key={c.name}>
                  <div className="flex justify-between gap-3 text-sm text-ink">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted">
                      <strong className="text-ink">{c.count}</strong> · {percent(c.count, received)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
                    <Reveal
                      effect="grow"
                      delay={150 + i * 100}
                      className={`h-full rounded-full ${categoryBars[c.name]}`}
                      style={{ width: `${(c.count / maxCount) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120} className="rounded-3xl bg-brand-soft p-6 sm:p-8 lg:col-span-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-xl font-bold text-ink">How your data is handled</h3>
            <ul className="mt-4 space-y-3 leading-relaxed text-ink">
              {transparencyPoints.map((point) => (
                <li key={point} className="flex gap-3">
                  <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

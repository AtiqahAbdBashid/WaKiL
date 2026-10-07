import { ybComplaints } from '../../data/ybSample'

// Stylised stand-in for a real map; swap for a map library when the Map page is built.
// Hotspots derived from open complaints per locality.
const counts = [...new Set(ybComplaints.map((c) => c.locality))]
  .map((locality) => ({
    locality,
    open: ybComplaints.filter((c) => c.locality === locality && c.status !== 'Resolved' && c.status !== 'Declined').length,
  }))
  .sort((a, b) => b.open - a.open)
  .slice(0, 4)

const slots = [
  { x: 56, y: 62, r: 15, color: 'bg-accent' },
  { x: 22, y: 42, r: 9, color: 'bg-accent' },
  { x: 78, y: 26, r: 7, color: 'bg-mint' },
  { x: 85, y: 76, r: 8, color: 'bg-violet' },
]

const hotspots = counts.map((c, i) => ({ area: c.locality, hot: i === 0, ...slots[i % slots.length] }))

export default function HeatmapPreview() {
  return (
    <div
      role="img"
      aria-label={`Complaint heatmap. Highest concentration in ${hotspots[0]?.area ?? 'the constituency'}.`}
      className="relative h-56 overflow-hidden rounded-3xl border border-line bg-[#eef3fd]"
    >
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <g stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round">
          <path d="M-5 20 L40 14 L105 40" />
          <path d="M20 -5 L34 30 L28 65" />
          <path d="M60 -5 L72 30 L95 65" />
          <path d="M-5 48 L50 40 L105 22" />
        </g>
        <path
          d="M-2 12 L30 8 L70 12 L104 10 M-2 42 L20 52 L60 55 L102 50"
          className="text-brand"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="1.6 1.6"
          fill="none"
        />
      </svg>

      {hotspots.map((h) => (
        <span
          key={h.area}
          aria-hidden="true"
          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-[6px] ${h.color}`}
          style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.r * 2}%`, aspectRatio: '1' }}
        />
      ))}
      {hotspots.map((h) => (
        <span
          key={`${h.area}-label`}
          aria-hidden="true"
          className={`absolute -translate-x-1/2 -translate-y-[170%] whitespace-nowrap rounded-lg px-2 py-1 text-[11px] font-semibold ${
            h.hot ? 'bg-ink text-white' : 'bg-white text-ink shadow-sm'
          }`}
          style={{ left: `${h.x}%`, top: `${h.y}%` }}
        >
          {h.area}
        </span>
      ))}
    </div>
  )
}

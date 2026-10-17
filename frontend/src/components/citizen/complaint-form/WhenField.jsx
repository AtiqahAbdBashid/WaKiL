import { Calendar } from 'lucide-react'

const QUICK_TIMES = ['Today', 'Yesterday', 'Past 3 days', 'Ongoing issue since last week']

export default function WhenField({ whenText, onChange }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center justify-between">
        <label
          htmlFor="complaint-when"
          className="text-base font-bold text-ink sm:text-lg flex items-center gap-2"
        >
          <Calendar className="h-5 w-5 text-brand" />
          <span>5. When Did It Happen?</span>
          <span className="text-rose-500 text-sm">*</span>
        </label>
        <span className="text-xs text-muted">Required</span>
      </div>
      <p className="mt-1 text-xs text-muted sm:text-sm">
        Enter the date or timeframe when the issue started or was noticed.
      </p>

      <div className="mt-3">
        <input
          id="complaint-when"
          type="text"
          required
          value={whenText}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. 5 October 2026 or since yesterday evening"
          className="w-full rounded-2xl border border-line bg-canvas/40 px-4 py-3.5 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:bg-white focus:outline-2 focus:outline-brand/30"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted mr-1">Quick options:</span>
        {QUICK_TIMES.map((time) => (
          <button
            key={time}
            type="button"
            onClick={() => onChange(time)}
            className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink transition hover:border-brand hover:text-brand"
          >
            {time}
          </button>
        ))}
      </div>
    </section>
  )
}

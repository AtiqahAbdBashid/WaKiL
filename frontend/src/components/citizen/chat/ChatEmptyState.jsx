import { Sparkles } from 'lucide-react'
import { citizenUser } from '../../../data/citizenMock'

const suggestions = [
  'There is a pothole on Jalan Pantai Baharu',
  'The street light is out at the housing estate junction',
  'The drain is blocked and water is pooling',
  'Rubbish has not been collected since last week',
  'How does WaKiL work?',
]

const firstName = citizenUser.name.split(' ')[0]

export default function ChatEmptyState({ onPick }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 pb-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand shadow-sm">
        <Sparkles className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        Hi, {firstName}. How can I assist you today?
      </h2>
      <p className="mt-2 max-w-lg text-sm text-muted">
        I can assist you in filing complaints to your MP or ADUN, detailing incidents, and answering questions about
        the WaKiL civic service.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-2xl">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-full border border-line bg-canvas/40 px-4 py-2 text-sm font-medium text-ink transition hover:border-brand hover:bg-brand-soft hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

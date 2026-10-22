import { Sparkles } from 'lucide-react'

export default function CategoryPicker({ categories = [], selectedCategories = [] }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4">
        <p className="text-sm font-semibold text-ink">AI selected categories</p>
        <p className="mt-1 text-sm leading-5 text-muted">
          WaKiL AI chooses the primary category and any suitable related categories.
          These selections are locked.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-brand/20 bg-brand-soft/40 px-3 py-2 text-xs font-semibold text-brand">
        <Sparkles className="h-4 w-4" />
        {selectedCategories.length ? `${selectedCategories.length} AI-selected categor${selectedCategories.length === 1 ? 'y' : 'ies'}` : 'Waiting for AI category analysis'}
      </div>

      <select
        aria-label="AI selected complaint categories"
        aria-disabled="true"
        multiple
        size={Math.min(Math.max(categories.length, 2), 6)}
        value={selectedCategories}
        disabled
        className="mt-3 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-100"
      >
        {categories.map((item) => {
          const value = typeof item === 'string' ? item : item.name ?? item.label ?? item.category
          return value ? <option key={value} value={value}>{value}</option> : null
        })}
      </select>
      {!selectedCategories.length && (
        <p className="mt-2 text-xs text-muted">Add a description or photo to let AI select categories.</p>
      )}
    </section>
  )
}

import { Check, Tag } from 'lucide-react'

export default function CategoryPicker({ categories, category, aiSuggestion, onSelect }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center justify-between">
        <label className="text-base font-bold text-ink sm:text-lg flex items-center gap-2">
          <Tag className="h-5 w-5 text-brand" />
          <span>3. Select Category</span>
          <span className="text-rose-500 text-sm">*</span>
        </label>
        <span className="text-xs text-muted">Review or override</span>
      </div>
      <p className="mt-1 text-xs text-muted sm:text-sm">
        Confirm the category suggested by Gemini, or select the best matching category from the list.
      </p>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {categories.map((cat) => {
          const isSelected = category === cat
          const isAiSuggested = aiSuggestion?.category === cat

          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelect(cat)}
              className={`relative flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs sm:text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-brand ${
                isSelected
                  ? 'border-brand bg-brand text-white shadow-sm'
                  : 'border-line bg-canvas/40 text-ink hover:border-brand/60 hover:bg-white'
              }`}
            >
              <span>{cat}</span>
              {isAiSuggested && !isSelected && (
                <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand">
                  AI Pick
                </span>
              )}
              {isSelected && <Check className="h-3.5 w-3.5" />}
            </button>
          )
        })}
      </div>
    </section>
  )
}

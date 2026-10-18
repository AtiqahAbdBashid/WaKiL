import { Loader2, Sparkles } from 'lucide-react'

export default function AiSuggestionPanel({ aiSuggesting, aiSuggestion, aiError, image, category, whatHappened, onApplyCategory, onUseSummary }) {
  return (
    <div className="mt-2">
      {aiSuggesting && (
        <div className="flex items-center gap-2 rounded-2xl border border-brand/20 bg-brand-soft/40 px-4 py-3.5 text-xs text-brand font-medium">
          <Loader2 className="h-4 w-4 animate-spin text-brand" />
          <span>
            {image
              ? 'Gemini Vision is inspecting your photo to suggest summary, category & priority...'
              : 'Gemini is analyzing your description to suggest category & priority...'}
          </span>
        </div>
      )}

      {aiSuggestion && !aiSuggesting && (
        <div className="rounded-2xl border-2 border-brand/30 bg-gradient-to-r from-brand-soft/50 to-mint-soft/30 p-4 transition shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wide text-brand-dark">
                  Gemini AI Recommendation
                </span>
                <p className="text-sm font-extrabold text-ink">
                  Suggested Category: {aiSuggestion.category}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted">
                Confidence: {Math.round((aiSuggestion.confidence || 0.9) * 100)}%
              </span>
              <button
                type="button"
                onClick={() => onApplyCategory(aiSuggestion.category)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-sm ${
                  category === aiSuggestion.category
                    ? 'bg-mint-dark text-white'
                    : 'bg-brand text-white hover:bg-brand-dark'
                }`}
              >
                {category === aiSuggestion.category ? 'Applied ✓' : 'Use Category'}
              </button>
            </div>
          </div>

          {aiSuggestion.summary && (
            <div className="mt-3 border-t border-line/40 pt-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-xs text-ink/80">
                <strong className="font-semibold text-ink">AI Suggested Summary:</strong> &ldquo;{aiSuggestion.summary}&rdquo; · Priority:{' '}
                <span className="font-bold text-ink">{aiSuggestion.priority}</span>
              </p>
              {whatHappened !== aiSuggestion.summary && (
                <button
                  type="button"
                  onClick={() => onUseSummary(aiSuggestion.summary)}
                  className="self-start sm:self-auto rounded-lg bg-brand/10 hover:bg-brand/20 px-2.5 py-1 text-xs font-bold text-brand transition"
                >
                  Use AI Summary
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {aiError && !aiSuggesting && (
        <p className="text-xs text-muted">
          Note: AI auto-suggestion is currently unavailable, you can manually choose below.
        </p>
      )}

      {!aiSuggestion && !aiSuggesting && whatHappened.trim().length > 0 && whatHappened.trim().length < 15 && !image && (
        <p className="text-xs text-muted">
          Tip: Type a little more detail (at least 15 characters) or attach a photo for Gemini to suggest a category.
        </p>
      )}
    </div>
  )
}

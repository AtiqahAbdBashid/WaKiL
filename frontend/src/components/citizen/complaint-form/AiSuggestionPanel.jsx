import { Loader2, Sparkles } from 'lucide-react'

export default function AiSuggestionPanel({ aiSuggesting, aiSuggestion, aiError, image, whatHappened, onUseSummary }) {
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

            <span className="text-xs font-semibold text-muted">
              Confidence: {Math.round((aiSuggestion.confidence || 0.9) * 100)}%
            </span>
          </div>

          {aiSuggestion.secondary_categories?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-line/40 pt-3" aria-label="Other suitable categories">
              {aiSuggestion.secondary_categories.map((item) => (
                <span key={item} className="rounded-full border border-brand/20 bg-white/80 px-2.5 py-1 text-xs font-medium text-brand">
                  #{item.replaceAll(' ', '')}
                </span>
              ))}
            </div>
          )}

          {(aiSuggestion.summary || aiSuggestion.summary_tip) && (
            <div className="mt-3 border-t border-line/40 pt-3">
              {aiSuggestion.summary && (
                <>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink">Suggested stronger explanation</p>
                  <p className="mt-1 text-sm leading-6 text-ink/85">{aiSuggestion.summary}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs leading-5 text-muted">
                      Use this as a guide and keep only details you know to be accurate.
                    </p>
                    {whatHappened !== aiSuggestion.summary && (
                      <button
                        type="button"
                        onClick={() => onUseSummary?.(aiSuggestion.summary)}
                        className="rounded-lg bg-brand/10 px-2.5 py-1.5 text-xs font-bold text-brand transition hover:bg-brand/20"
                      >
                        Use suggested description
                      </button>
                    )}
                  </div>
                </>
              )}
              {aiSuggestion.summary_tip && (
                <p className="mt-2 rounded-xl border border-brand/15 bg-white/80 px-3 py-2 text-xs leading-5 text-brand-dark">
                  <strong>Helpful detail to add:</strong> {aiSuggestion.summary_tip}
                </p>
              )}
              {aiSuggestion.priority && (
                <p className="mt-2 text-xs text-muted">
                  Suggested priority: <span className="font-bold text-ink">{aiSuggestion.priority}</span>
                </p>
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

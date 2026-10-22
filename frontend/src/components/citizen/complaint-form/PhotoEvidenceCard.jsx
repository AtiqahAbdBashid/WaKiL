import { useRef } from 'react'
import { Camera, UploadCloud, X } from 'lucide-react'
import InlineNotice from '../../ui/InlineNotice'

export default function PhotoEvidenceCard({
  image,
  notice,
  requirement = 'optional',
  exceptionReason = '',
  onExceptionReasonChange,
  onDismissNotice,
  onFileChange,
  onRemove,
}) {
  const fileInputRef = useRef(null)
  const isRequired = requirement === 'required'

  return (
    <section className="flex flex-col justify-between rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-7">
      <div>
        <div className="flex items-center justify-between">
          <label className="text-base font-bold text-ink sm:text-lg flex items-center gap-2">
            <Camera className="h-5 w-5 text-brand" />
            <span>2. Photo Evidence</span>
            <span className={`text-xs font-semibold ${isRequired ? 'text-rose-600' : 'text-muted'}`}>
              ({isRequired ? 'Required for this category' : requirement === 'recommended' ? 'Recommended' : 'Optional'})
            </span>
          </label>
          <span className="text-xs font-semibold text-brand bg-brand-soft px-2.5 py-0.5 rounded-full">
            Gemini Vision
          </span>
        </div>
        <p className="mt-1 text-xs text-muted sm:text-sm">
          {isRequired
            ? 'A photo helps verify this type of issue. If you cannot provide one, select the reason below to request manual review.'
            : requirement === 'recommended'
              ? 'A photo can help explain this issue, but you can submit without one.'
              : 'A photo is optional. Upload one if it can help explain the issue.'}
        </p>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />
      <InlineNotice message={notice} onDismiss={onDismissNotice} className="mt-3" />

      {isRequired && !image && (
        <div className="mt-3">
          <label htmlFor="photo-exception" className="mb-1.5 block text-sm font-semibold text-ink">
            If you cannot provide a photo, tell us why
          </label>
          <select
            id="photo-exception"
            value={exceptionReason}
            onChange={(event) => onExceptionReasonChange(event.target.value)}
            className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="">Choose a reason to request manual review</option>
            <option value="unavailable">Photo unavailable</option>
            <option value="unsafe">Taking a photo would be unsafe</option>
            <option value="sensitive">The issue involves sensitive personal information</option>
            <option value="not_verifiable">The issue cannot reasonably be verified in a photo</option>
          </select>
          <p className="mt-1 text-xs leading-5 text-muted">
            Your report can still be submitted and will be marked for manual review.
          </p>
        </div>
      )}

      <div className="mt-3 flex-1 flex flex-col justify-center">
        {!image ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-[140px] flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-canvas/30 px-6 py-5 text-center transition hover:border-brand hover:bg-brand-soft/20"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm text-brand border border-line">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="mt-2 text-sm font-semibold text-ink">
              Click to upload photo evidence
            </p>
            <p className="mt-1 text-xs text-muted">
              Supports JPG, PNG, WEBP (auto-compressed for AI)
            </p>
          </div>
        ) : (
          <div className="flex min-h-[140px] flex-1 items-center gap-4 rounded-2xl border border-line bg-canvas/50 p-4">
            <img
              src={image}
              alt="Selected evidence preview"
              className="h-24 w-24 rounded-xl object-cover border border-line shadow-sm shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-ink truncate">Photo Attached</p>
                <span className="rounded-full bg-mint-soft px-2 py-0.5 text-[10px] font-bold text-mint-dark">
                  AI Analyzed
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted line-clamp-2">
                Stored in SQL and analyzed by Gemini Vision.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Change photo
                </button>
                <span className="text-muted text-xs">·</span>
                <button
                  type="button"
                  onClick={onRemove}
                  className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

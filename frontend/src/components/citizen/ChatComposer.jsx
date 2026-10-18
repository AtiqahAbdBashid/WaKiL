import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowUp, MapPin, Paperclip, X } from 'lucide-react'

import InlineNotice from '../ui/InlineNotice'
import { compressImageFile } from '../../utils/imageCompressor'

const MAX_HEIGHT = 144

export default function ChatComposer({
  value,
  onChange,
  onSend,
  inputRef,
  disabled = false,
  onOpenLocationModal = null,
  attachedImage = null,
  onAttachedImageChange = null,
}) {
  const fileInputRef = useRef(null)
  const [notice, setNotice] = useState('')
  const canSend = (value.trim().length > 0 || Boolean(attachedImage)) && !disabled

  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden'
  }, [value, inputRef])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      if (canSend) onSend()
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setNotice('Please upload an image file (e.g. JPG, PNG).')
      return
    }
    setNotice('')
    try {
      const compressedDataUri = await compressImageFile(file)
      onAttachedImageChange?.(compressedDataUri)
    } catch (err) {
      console.error('Image compression failed:', err)
      // Fallback to raw reader if canvas compression fails
      const reader = new FileReader()
      reader.onload = () => {
        onAttachedImageChange?.(reader.result)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (canSend) onSend()
      }}
      className={`rounded-3xl border border-line bg-white p-3 shadow-card transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 ${
        disabled ? 'opacity-80 bg-slate-50/50' : ''
      }`}
    >
      <InlineNotice message={notice} onDismiss={() => setNotice('')} className="mb-2.5" />

      {/* Attached image preview */}
      {attachedImage && (
        <div className="relative mb-2.5 inline-flex items-center gap-2.5 rounded-2xl border border-line bg-canvas/70 p-1.5 pr-3 shadow-sm">
          <img
            src={attachedImage}
            alt="Complaint evidence preview"
            className="h-12 w-12 rounded-xl object-cover border border-line/60"
          />
          <div className="text-xs">
            <p className="font-semibold text-ink">Photo attached</p>
            <p className="text-[11px] text-muted">Gemini will inspect this image</p>
          </div>
          <button
            type="button"
            onClick={() => onAttachedImageChange?.(null)}
            aria-label="Remove attached photo"
            className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-line/80 text-ink hover:bg-line hover:text-rose-600 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <label htmlFor="wakil-message" className="sr-only">
        Message WaKiL AI
      </label>
      <textarea
        id="wakil-message"
        ref={inputRef}
        rows={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          disabled
            ? 'WaKiL AI is replying...'
            : attachedImage
            ? 'Describe what happened in the photo...'
            : 'Ask a question or describe an issue (attach photo if available)'
        }
        className="block w-full resize-none bg-transparent px-2 py-1.5 text-base leading-6 text-ink placeholder:text-muted focus:outline-none disabled:cursor-not-allowed"
      />
      <div className="mt-1 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach photo of the issue"
            title="Attach photo of the issue"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50 ${
              attachedImage ? 'text-brand bg-brand-soft' : 'text-muted hover:text-ink'
            }`}
          >
            <Paperclip className="h-5 w-5" aria-hidden="true" />
          </button>
          {onOpenLocationModal && (
            <button
              type="button"
              disabled={disabled}
              onClick={onOpenLocationModal}
              aria-label="Pin location on map"
              title="Pin location on map (or use current location)"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-canvas hover:text-brand focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50"
            >
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          className={`flex h-9 w-9 items-center justify-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
            canSend ? 'bg-brand text-white hover:bg-brand-dark' : 'cursor-not-allowed bg-line text-muted'
          }`}
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </form>
  )
}

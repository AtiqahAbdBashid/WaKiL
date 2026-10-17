import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  Crosshair,
  ExternalLink,
  Loader2,
  Map,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  Tag,
  UploadCloud,
  X,
} from 'lucide-react'

import { citizenUser } from '../../data/citizenMock'
import {
  fetchCategories,
  submitComplaintForm,
  suggestCategory,
} from '../../services/chatApi'
import { compressImageFile } from '../../utils/imageCompressor'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import InlineNotice from '../../components/ui/InlineNotice'
import LocationPickerModal from '../../components/citizen/LocationPickerModal'

const DEFAULT_CATEGORIES = [
  'Infrastructure/Roads',
  'Drainage & Flood',
  'Waste & Sanitation',
  'Public Safety',
  'Utilities',
  'Welfare & Aid',
  'Others',
]

const QUICK_LOCATIONS = [
  'Lembah Pantai',
  'Bangsar',
  'Pantai Dalam',
  'Kerinchi',
]

const QUICK_TIMES = [
  'Today',
  'Yesterday',
  'Past 3 days',
  'Ongoing issue since last week',
]

export default function SubmitComplaintPage() {
  const navigate = useNavigate()

  const [whatHappened, setWhatHappened] = useState('')
  const [location, setLocation] = useState('')
  const [whenText, setWhenText] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [image, setImage] = useState(null)
  const fileInputRef = useRef(null)

  const [aiSuggesting, setAiSuggesting] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [aiError, setAiError] = useState(null)
  const debounceTimer = useRef(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submittedTicket, setSubmittedTicket] = useState(null)
  const [copied, setCopied] = useState(false)

  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [locatingCurrent, setLocatingCurrent] = useState(false)
  const [locationNotice, setLocationNotice] = useState('')
  const [imageNotice, setImageNotice] = useState('')

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationNotice('Geolocation is not supported by your browser.')
      return
    }

    setLocationNotice('')
    setLocatingCurrent(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'ms, en' } },
          )
          let placeName = 'Current location'
          if (res.ok) {
            const data = await res.json()
            const addr = data.address || {}
            const primary =
              addr.road ||
              addr.neighbourhood ||
              addr.suburb ||
              addr.residential ||
              addr.building ||
              data.name ||
              'Incident area'
            const area = addr.suburb || addr.city || addr.town || ''
            placeName = area && area !== primary ? `${primary}, ${area}` : primary
          }
          // Format requested: "Taman Mawar (lat, long)"
          const formatted = `${placeName} (${lat.toFixed(5)}, ${lng.toFixed(5)})`
          setLocation(formatted)
        } catch {
          setLocation(`Current location (${lat.toFixed(5)}, ${lng.toFixed(5)})`)
        } finally {
          setLocatingCurrent(false)
        }
      },
      (err) => {
        setLocatingCurrent(false)
        setLocationNotice(`Unable to get current location: ${err.message}`)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const handleMapConfirm = ({ formatted }) => {
    setLocation(formatted)
  }


  useEffect(() => {
    let active = true
    fetchCategories().then((cats) => {
      if (active && cats?.length) {
        setCategories(cats)
      }
    })
    return () => {
      active = false
    }
  }, [])

  // Debounced AI category suggestion when summary changes
  const handleSummaryChange = (e) => {
    const text = e.target.value
    setWhatHappened(text)
    setSubmitError(null)

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (text.trim().length >= 15 || image) {
      debounceTimer.current = setTimeout(() => {
        triggerAiSuggestion(text, location, whenText, image)
      }, 1000)
    } else {
      setAiSuggestion(null)
      setAiError(null)
    }
  }

  const triggerAiSuggestion = async (
    summaryToAnalyze = whatHappened,
    currentLocation = location,
    currentTime = whenText,
    currentImage = image,
  ) => {
    if (!summaryToAnalyze.trim() && !currentImage) return

    setAiSuggesting(true)
    setAiError(null)
    try {
      const result = await suggestCategory({
        summary: summaryToAnalyze.trim(),
        location: currentLocation.trim(),
        when: currentTime.trim(),
        image: currentImage,
      })
      setAiSuggestion(result)
      if (!category && result.category) {
        setCategory(result.category)
      }
      if (result.priority) {
        setPriority(result.priority)
      }
      // If summary is empty and Gemini generated a summary from the image, suggest/fill it
      if (!summaryToAnalyze.trim() && result.summary) {
        setWhatHappened(result.summary)
      }
    } catch (err) {
      setAiError(err.message || 'Unable to get AI recommendation.')
    } finally {
      setAiSuggesting(false)
    }
  }

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setImageNotice('Please upload an image file (e.g. JPG, PNG, WEBP).')
      return
    }
    setImageNotice('')

    try {
      const dataUri = await compressImageFile(file)
      setImage(dataUri)
      triggerAiSuggestion(whatHappened, location, whenText, dataUri)
    } catch (err) {
      console.error('Image compression failed:', err)
      const reader = new FileReader()
      reader.onload = () => {
        const dataUri = reader.result
        setImage(dataUri)
        triggerAiSuggestion(whatHappened, location, whenText, dataUri)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  const removeImage = () => {
    setImage(null)
    if (whatHappened.trim().length >= 15) {
      triggerAiSuggestion(whatHappened, location, whenText, null)
    } else {
      setAiSuggestion(null)
    }
  }

  const applyCategory = (cat) => {
    setCategory(cat)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!whatHappened.trim()) {
      setSubmitError('Please provide a summary of what happened.')
      return
    }
    if (!location.trim()) {
      setSubmitError('Please specify the location of the incident.')
      return
    }
    if (!whenText.trim()) {
      setSubmitError('Please specify when the incident happened.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const response = await submitComplaintForm({
        what_happened: whatHappened.trim(),
        location: location.trim(),
        when: whenText.trim(),
        category: category || (aiSuggestion?.category ?? 'Others'),
        priority: priority || (aiSuggestion?.priority ?? 'Medium'),
        image: image || null,
      })

      setSubmittedTicket(response)
    } catch (err) {
      setSubmitError(
        err.message ||
          'Failed to submit complaint. Please check your backend connection.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const copyTicketId = (id) => {
    if (!id) return
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const resetForm = () => {
    setWhatHappened('')
    setLocation('')
    setWhenText('')
    setCategory('')
    setPriority('Medium')
    setImage(null)
    setAiSuggestion(null)
    setAiError(null)
    setSubmitError(null)
    setSubmittedTicket(null)
  }

  if (submittedTicket) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
        <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
          <div className="bg-gradient-to-br from-mint-dark to-mint p-8 text-white text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">
              Complaint Successfully Submitted!
            </h1>
            <p className="mt-2 text-sm text-white/90">
              Your official civic report has been received and logged for your
              representative&apos;s office.
            </p>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <div className="rounded-2xl border border-line bg-canvas/40 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Official Ticket ID
                  </p>
                  <p className="mt-0.5 font-mono text-xl font-extrabold text-ink sm:text-2xl">
                    {submittedTicket.ticket_id}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyTicketId(submittedTicket.ticket_id)}
                  className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink shadow-sm transition hover:bg-canvas"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-mint-dark" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? 'Copied!' : 'Copy Ticket ID'}
                </button>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted">Status</dt>
                  <dd className="mt-1">
                    <Badge tone="mint">{submittedTicket.status || 'Pending'}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Category</dt>
                  <dd className="mt-1 font-semibold text-ink">
                    {submittedTicket.category}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Priority</dt>
                  <dd className="mt-1 font-semibold text-ink">
                    {submittedTicket.priority}
                  </dd>
                </div>
                {submittedTicket.parliament && (
                  <div>
                    <dt className="text-xs text-muted">Parliament</dt>
                    <dd className="mt-1 font-semibold text-ink">
                      {submittedTicket.parliament}
                    </dd>
                  </div>
                )}
                {submittedTicket.dun && (
                  <div>
                    <dt className="text-xs text-muted">DUN</dt>
                    <dd className="mt-1 font-semibold text-ink">
                      {submittedTicket.dun}
                    </dd>
                  </div>
                )}
              </dl>

              {(submittedTicket.image_url || image) && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-canvas/40 p-3">
                  <img
                    src={submittedTicket.image_url || image}
                    alt="Incident evidence photo"
                    className="h-14 w-14 rounded-xl object-cover border border-line/60 shadow-sm"
                  />
                  <div className="text-xs">
                    <p className="font-semibold text-ink">Photo Evidence Attached</p>
                    <p className="text-muted mt-0.5">Stored in official SQL records & verified by Gemini AI.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-2xl bg-brand-soft/40 p-4 text-xs leading-relaxed text-ink/80">
              <p className="font-semibold text-brand-dark">What happens next?</p>
              <ul className="list-inside list-disc space-y-1">
                <li>
                  Your report has been assigned to the service team for{' '}
                  <strong>
                    {submittedTicket.parliament
                      ? `${submittedTicket.parliament}${submittedTicket.dun ? ` (${submittedTicket.dun})` : ''}`
                      : citizenUser.area}
                  </strong>.
                </li>
                <li>
                  Automated duplicate triage and spatial clustering have recorded
                  this incident.
                </li>
                <li>
                  You can monitor status changes, officer comments, and repair
                  milestones in <strong>My Complaints</strong>.
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
              <Button
                as={Link}
                to="/citizen/aduan-saya"
                variant="primary"
                size="lg"
                className="gap-2 justify-center"
              >
                Track in My Complaints
                <ExternalLink className="h-4 w-4" />
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="lg" onClick={resetForm} className="flex-1 sm:flex-initial">
                  Submit Another
                </Button>
                <Button
                  as={Link}
                  to="/citizen/dashboard"
                  variant="ghost"
                  size="lg"
                  className="flex-1 sm:flex-initial"
                >
                  Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/citizen/dashboard')}
            aria-label="Back to dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted transition hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                Submit a Complaint
              </h1>
              <Badge tone="accent">Official Form</Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted sm:text-sm">
              Constituency area: <strong>{citizenUser.area}</strong>
            </p>
          </div>
        </div>

        <Link
          to="/citizen/wakil-ai"
          className="flex items-center gap-2 rounded-2xl border border-line bg-canvas/60 px-3.5 py-2 text-xs font-semibold text-brand transition hover:border-brand hover:bg-brand-soft"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Prefer conversational chat? Use WaKiL AI</span>
        </Link>
      </div>

      {submitError && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div className="flex-1">
            <p className="font-semibold">Submission Failed</p>
            <p className="mt-0.5 text-xs text-rose-800">{submitError}</p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* STARTING OPTIONS: Summary & Photo Evidence Side-by-Side */}
        <div className="space-y-4">
          {/* Informational Guidance Banner */}
          <div className="flex items-start gap-3 rounded-2xl border border-brand/20 bg-gradient-to-r from-brand-soft/70 via-mint-soft/30 to-white p-4 text-xs sm:text-sm text-ink shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm mt-0.5">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-ink sm:text-sm">
                Start with Either Option: Summary or Photo
              </p>
              <p className="mt-0.5 text-xs text-muted sm:text-xs text-ink/80 leading-relaxed">
                You can start by <strong>typing what happened</strong>, or <strong>uploading a photo</strong>. If you upload a photo first, Gemini Vision will automatically analyze it and draft the summary, category, and priority for you!
              </p>
            </div>
          </div>

          {/* Side-by-Side Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* CARD 1: Summary of What Happened */}
            <section className="flex flex-col justify-between rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-7">
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="what-happened"
                    className="text-base font-bold text-ink sm:text-lg flex items-center gap-2"
                  >
                    <span>1. Summary of What Happened</span>
                    <span className="text-rose-500 text-sm">*</span>
                  </label>
                  <span className="text-xs font-semibold text-brand bg-brand-soft px-2.5 py-0.5 rounded-full">
                    Text / AI Draft
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted sm:text-sm">
                  Explain the issue clearly, or let Gemini Vision draft it from your photo.
                </p>
              </div>

              <div className="relative mt-3 flex-1 flex flex-col">
                <textarea
                  id="what-happened"
                  rows={5}
                  required
                  value={whatHappened}
                  onChange={handleSummaryChange}
                  placeholder="e.g. Terdapat lubang jalan raya yang sangat dalam berhampiran simpang masuk taman. Beberapa buah motosikal hampir terbabas..."
                  className="w-full flex-1 min-h-[140px] rounded-2xl border border-line bg-canvas/40 p-4 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:bg-white focus:outline-2 focus:outline-brand/30 leading-relaxed"
                />
              </div>
            </section>

            {/* CARD 2: Photo Evidence Upload */}
            <section className="flex flex-col justify-between rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-7">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-base font-bold text-ink sm:text-lg flex items-center gap-2">
                    <Camera className="h-5 w-5 text-brand" />
                    <span>2. Photo Evidence</span>
                    <span className="text-xs font-normal text-muted">(Optional)</span>
                  </label>
                  <span className="text-xs font-semibold text-brand bg-brand-soft px-2.5 py-0.5 rounded-full">
                    Gemini Vision
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted sm:text-sm">
                  Upload a photo first or after describing. Gemini will auto-generate the issue summary &amp; category.
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <InlineNotice message={imageNotice} onDismiss={() => setImageNotice('')} className="mt-3" />

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
                          onClick={removeImage}
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
          </div>

          {/* Gemini AI Category & Summary Suggestion Box */}
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
                      onClick={() => applyCategory(aiSuggestion.category)}
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
                        onClick={() => setWhatHappened(aiSuggestion.summary)}
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
        </div>

        {/* FIELD 3: Category Selection */}
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
                  onClick={() => setCategory(cat)}
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

        {/* FIELD 4: Location */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="complaint-location"
              className="text-base font-bold text-ink sm:text-lg flex items-center gap-2"
            >
              <MapPin className="h-5 w-5 text-accent" />
              <span>4. Location</span>
              <span className="text-rose-500 text-sm">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMapModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-brand/30 bg-brand-soft/70 px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white"
              >
                <Map className="h-3.5 w-3.5" />
                <span>Pin on Map</span>
              </button>
              <button
                type="button"
                onClick={handleCurrentLocation}
                disabled={locatingCurrent}
                className="flex items-center gap-1.5 rounded-xl border border-line bg-canvas/60 px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
              >
                {locatingCurrent ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Crosshair className="h-3.5 w-3.5 text-accent" />
                )}
                <span>Use Current Location</span>
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Specify the street name, taman, landmark, or pin the exact spot on the map. Coordinates will automatically be attached.
          </p>
          <InlineNotice message={locationNotice} onDismiss={() => setLocationNotice('')} className="mt-2" />

          <div className="mt-3">
            <input
              id="complaint-location"
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Taman Mawar (3.12050, 101.67020) atau Jalan Bangsar"
              className="w-full rounded-2xl border border-line bg-canvas/40 px-4 py-3.5 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:bg-white focus:outline-2 focus:outline-brand/30"
            />
          </div>

          {/* Coordinates detected indicator */}
          {(() => {
            const match = location.match(/\(([-+]?\d*\.?\d+),\s*([-+]?\d*\.?\d+)\)/)
            if (!match) return null
            return (
              <div className="mt-2.5 flex items-center justify-between rounded-xl bg-mint-soft/80 px-3.5 py-2 text-xs">
                <span className="font-semibold text-mint-dark flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-mint-dark" />
                  GPS Coordinates: {parseFloat(match[1]).toFixed(5)}, {parseFloat(match[2]).toFixed(5)}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(true)}
                  className="font-bold text-brand hover:underline"
                >
                  Adjust Pin →
                </button>
              </div>
            )
          })()}

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted mr-1">Quick area tags:</span>
            {QUICK_LOCATIONS.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocation((prev) => (prev ? `${prev}, ${loc}` : loc))}
                className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink transition hover:border-brand hover:text-brand"
              >
                + {loc}
              </button>
            ))}
          </div>
        </section>

        {/* FIELD 5: When it happened */}
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
              onChange={(e) => setWhenText(e.target.value)}
              placeholder="e.g. 5 Oktober 2026 atau bermula sejak petang semalam"
              className="w-full rounded-2xl border border-line bg-canvas/40 px-4 py-3.5 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:bg-white focus:outline-2 focus:outline-brand/30"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted mr-1">Quick options:</span>
            {QUICK_TIMES.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setWhenText(time)}
                className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink transition hover:border-brand hover:text-brand"
              >
                {time}
              </button>
            ))}
          </div>
        </section>

        {/* Bottom Submission Bar */}
        <div className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-ink">Ready to file your official report?</p>
            <p className="text-xs text-muted">
              Once submitted, an official ticket will be created for review by your wakil rakyat.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/citizen/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="lg"
              disabled={submitting}
              className="gap-2 px-6"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Submit Complaint</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Interactive Map Picker Modal */}
      <LocationPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialLocation={location}
        onConfirm={handleMapConfirm}
      />
    </div>
  )
}

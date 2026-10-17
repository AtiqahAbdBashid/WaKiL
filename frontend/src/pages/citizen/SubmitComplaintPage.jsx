import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Loader2, MessageCircle, Send, Sparkles } from 'lucide-react'

import { citizenUser } from '../../data/citizenMock'
import {
  fetchCategories,
  submitComplaintForm,
  suggestCategory,
} from '../../services/chatApi'
import { compressImageFile } from '../../utils/imageCompressor'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import LocationPickerModal from '../../components/citizen/LocationPickerModal'
import AiSuggestionPanel from '../../components/citizen/complaint-form/AiSuggestionPanel'
import CategoryPicker from '../../components/citizen/complaint-form/CategoryPicker'
import LocationField from '../../components/citizen/complaint-form/LocationField'
import PhotoEvidenceCard from '../../components/citizen/complaint-form/PhotoEvidenceCard'
import SubmittedTicketCard from '../../components/citizen/complaint-form/SubmittedTicketCard'
import WhenField from '../../components/citizen/complaint-form/WhenField'

const DEFAULT_CATEGORIES = [
  'Infrastructure/Roads',
  'Drainage & Flood',
  'Waste & Sanitation',
  'Public Safety',
  'Utilities',
  'Welfare & Aid',
  'Others',
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

  const [aiSuggesting, setAiSuggesting] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [aiError, setAiError] = useState(null)
  const debounceTimer = useRef(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submittedTicket, setSubmittedTicket] = useState(null)

  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [imageNotice, setImageNotice] = useState('')

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
      <SubmittedTicketCard submittedTicket={submittedTicket} image={image} onReset={resetForm} />
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
                  placeholder="e.g. There is a very deep pothole near the entrance to the housing estate. Several motorbikes nearly fell..."
                  className="w-full flex-1 min-h-[140px] rounded-2xl border border-line bg-canvas/40 p-4 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:bg-white focus:outline-2 focus:outline-brand/30 leading-relaxed"
                />
              </div>
            </section>

            <PhotoEvidenceCard
              image={image}
              notice={imageNotice}
              onDismissNotice={() => setImageNotice('')}
              onFileChange={handleImageChange}
              onRemove={removeImage}
            />
          </div>

          <AiSuggestionPanel
            aiSuggesting={aiSuggesting}
            aiSuggestion={aiSuggestion}
            aiError={aiError}
            image={image}
            category={category}
            whatHappened={whatHappened}
            onApplyCategory={setCategory}
            onUseSummary={setWhatHappened}
          />
        </div>

        <CategoryPicker categories={categories} category={category} aiSuggestion={aiSuggestion} onSelect={setCategory} />

        <LocationField location={location} onChange={setLocation} onOpenMap={() => setIsMapModalOpen(true)} />

        <WhenField whenText={whenText} onChange={setWhenText} />

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

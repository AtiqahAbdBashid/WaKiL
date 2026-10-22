import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  FileText,
  Loader2,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
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
import LocationPickerModal from '../../components/citizen/LocationPickerModal'
import AiSuggestionPanel from '../../components/citizen/complaint-form/AiSuggestionPanel'
import CategoryPicker from '../../components/citizen/complaint-form/CategoryPicker'
import LocationField from '../../components/citizen/complaint-form/LocationField'
import PhotoEvidenceCard from '../../components/citizen/complaint-form/PhotoEvidenceCard'
import SubmittedTicketCard from '../../components/citizen/complaint-form/SubmittedTicketCard'
import WhenField from '../../components/citizen/complaint-form/WhenField'

const DEFAULT_CATEGORIES = [
  'Roads & Infrastructure',
  'Flooding & Drainage',
  'Welfare & Assistance',
  'Housing',
  'Employment & Economy',
  'Healthcare',
  'Education',
  'Public Safety',
  'Cleanliness & Environment',
  'Transportation',
  'Government Services',
  'Community Issues',
  'Other',
]

const PHOTO_REQUIRED_CATEGORIES = new Set([
  'Roads & Infrastructure',
  'Flooding & Drainage',
  'Cleanliness & Environment',
])
const PHOTO_RECOMMENDED_CATEGORIES = new Set([
  'Public Safety', 'Transportation', 'Housing', 'Community Issues',
])

const STEPS = [
  { number: 1, label: 'Describe', icon: FileText },
  { number: 2, label: 'Details', icon: MapPin },
  { number: 3, label: 'Review', icon: ClipboardCheck },
]

function StepIndicator({ currentStep }) {
  return (
    <div className="mb-7 rounded-2xl border border-line bg-white px-4 py-5 shadow-sm sm:px-6">
      <div className="flex items-center">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          const isComplete = currentStep > step.number
          const isCurrent = currentStep === step.number

          return (
            <div key={step.number} className="flex flex-1 items-center">
              <div className="flex min-w-0 flex-col items-center gap-2 sm:flex-row sm:gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${isComplete || isCurrent
                    ? 'border-brand bg-brand text-white'
                    : 'border-line bg-canvas text-muted'
                    }`}
                >
                  {isComplete ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>

                <div className="text-center sm:text-left">
                  <p
                    className={`text-xs font-bold sm:text-sm ${isCurrent ? 'text-brand' : 'text-ink'
                      }`}
                  >
                    {step.label}
                  </p>
                  <p className="hidden text-xs text-muted sm:block">
                    Step {step.number}
                  </p>
                </div>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-px flex-1 sm:mx-4 ${currentStep > step.number
                    ? 'bg-brand'
                    : 'bg-line'
                    }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ReviewRow({ label, children }) {
  return (
    <div className="border-b border-line py-4 last:border-b-0">
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">
        {label}
      </p>
      <div className="text-sm leading-6 text-ink">{children}</div>
    </div>
  )
}

export default function SubmitComplaintPage() {
  const navigate = useNavigate()
  const debounceTimer = useRef(null)

  const [step, setStep] = useState(1)

  const [whatHappened, setWhatHappened] = useState('')
  const [location, setLocation] = useState('')
  const [whenText, setWhenText] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [image, setImage] = useState(null)
  const [photoExceptionReason, setPhotoExceptionReason] = useState('')

  const [aiSuggesting, setAiSuggesting] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [aiError, setAiError] = useState(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submittedTicket, setSubmittedTicket] = useState(null)

  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [imageNotice, setImageNotice] = useState('')

  const selectedAiCategories = aiSuggestion
    ? [aiSuggestion.category, ...(aiSuggestion.secondary_categories || [])]
    : []
  const requiresPhoto = selectedAiCategories.some((item) => PHOTO_REQUIRED_CATEGORIES.has(item))
  const recommendsPhoto = selectedAiCategories.some((item) => PHOTO_RECOMMENDED_CATEGORIES.has(item))

  useEffect(() => {
    fetchCategories().then((result) => {
      if (result.length) setCategories(result)
    })
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

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

      if (result.priority) {
        setPriority(result.priority)
      }

    } catch (error) {
      setAiError(error.message || 'Unable to get an AI recommendation.')
    } finally {
      setAiSuggesting(false)
    }
  }

  const handleSummaryChange = (event) => {
    const text = event.target.value

    setWhatHappened(text)
    setSubmitError(null)
    setAiSuggestion(null)
    setPhotoExceptionReason('')

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

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setImageNotice('Please upload an image file, such as JPG, PNG or WEBP.')
      event.target.value = ''
      return
    }

    setImageNotice('')

    try {
      const dataUri = await compressImageFile(file)
      setImage(dataUri)
      setPhotoExceptionReason('')
      await triggerAiSuggestion(whatHappened, location, whenText, dataUri)
    } catch (error) {
      console.error('Image compression failed:', error)

      // Fallback if compression fails.
      try {
        const dataUri = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = () => reject(new Error('Unable to read image.'))
          reader.readAsDataURL(file)
        })

        setImage(dataUri)
        setPhotoExceptionReason('')
        await triggerAiSuggestion(whatHappened, location, whenText, dataUri)
      } catch {
        setImageNotice('Unable to process this image. Please try another file.')
      }
    } finally {
      event.target.value = ''
    }
  }

  const removeImage = () => {
    setImage(null)
    setPhotoExceptionReason('')
    setImageNotice('')

    if (whatHappened.trim().length >= 15) {
      triggerAiSuggestion(whatHappened, location, whenText, null)
    } else {
      setAiSuggestion(null)
      setAiError(null)
    }
  }

  const handleMapConfirm = ({ formatted }) => {
    setLocation(formatted)
    setIsMapModalOpen(false)
  }

  const resetForm = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    setStep(1)
    setWhatHappened('')
    setLocation('')
    setWhenText('')
    setPriority('Medium')
    setImage(null)
    setPhotoExceptionReason('')
    setAiSuggestion(null)
    setAiSuggesting(false)
    setAiError(null)
    setImageNotice('')
    setSubmitError(null)
    setSubmittedTicket(null)
    setIsMapModalOpen(false)
  }

  const continueToDetails = () => {
    setSubmitError(null)

    if (!whatHappened.trim() && !image) {
      setSubmitError('Describe the issue or upload a photo to continue.')
      return
    }

    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const continueToReview = () => {
    setSubmitError(null)

    if (!location.trim()) {
      setSubmitError('Please specify the location of the incident.')
      return
    }

    if (!whenText.trim()) {
      setSubmitError('Please specify when the incident happened.')
      return
    }

    if (requiresPhoto && !image && !photoExceptionReason) {
      setStep(1)
      setSubmitError('Please attach a photo for this category or choose why photo evidence is unavailable, unsafe, or sensitive.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError(null)

    if (!whatHappened.trim()) {
      setSubmitError(
        'Please provide a complaint summary. If you started with a photo, review the AI-generated summary first.',
      )
      return
    }

    if (!location.trim()) {
      setStep(2)
      setSubmitError('Please specify the location of the incident.')
      return
    }

    if (!whenText.trim()) {
      setStep(2)
      setSubmitError('Please specify when the incident happened.')
      return
    }

    if (!aiSuggestion?.category) {
      setSubmitError('Please wait for WaKiL AI to select the complaint categories before submitting.')
      return
    }

    if (requiresPhoto && !image && !photoExceptionReason) {
      setStep(1)
      setSubmitError('Please attach a photo for this category or choose why photo evidence is unavailable, unsafe, or sensitive.')
      return
    }

    setSubmitting(true)

    try {
      const response = await submitComplaintForm({
        what_happened: whatHappened.trim(),
        location: location.trim(),
        when: whenText.trim(),
        category: aiSuggestion.category,
        categories: [aiSuggestion.category, ...(aiSuggestion.secondary_categories || [])],
        priority: priority || aiSuggestion?.priority || 'Medium',
        image: image || null,
        photo_exception_reason: photoExceptionReason || null,
      })

      setSubmittedTicket(response)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setSubmitError(
        error.message ||
        'Failed to submit the complaint. Please check your backend connection.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedTicket) {
    return (
      <SubmittedTicketCard
        submittedTicket={submittedTicket}
        image={image}
        onReset={resetForm}
      />
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-8">
      {/* Page heading */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/citizen/dashboard')}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <Badge tone="accent" caps>
              Citizen service
            </Badge>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Submit a complaint
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              Report a community issue to your representative. Describe what
              happened, provide the location and review your report before
              submitting.
            </p>

            <p className="mt-2 text-xs text-muted">
              Constituency area:{' '}
              <strong className="text-ink">{citizenUser.area}</strong>
            </p>
          </div>

          <Link
            to="/citizen/wakil-ai"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-xs font-semibold text-brand transition hover:border-brand hover:bg-brand-soft"
          >
            <MessageCircle className="h-4 w-4" />
            Use WaKiL AI chat
          </Link>
        </div>
      </div>

      <StepIndicator currentStep={step} />

      {submitError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <p className="font-semibold">Please check your complaint</p>
            <p className="mt-1 text-xs leading-5">{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: Describe */}
        {step === 1 && (
          <div className="space-y-5">
            <section className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <FileText className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-ink sm:text-xl">
                    What would you like to report?
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Describe the issue in your own words, or upload a photo
                    and let AI help draft the description.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="what-happened"
                  className="mb-2 block text-sm font-semibold text-ink"
                >
                  Complaint summary
                  <span className="ml-1 text-rose-500">*</span>
                </label>

                <textarea
                  id="what-happened"
                  rows={5}
                  value={whatHappened}
                  onChange={handleSummaryChange}
                  placeholder="Explain what happened, where the problem is, and how it affects the community..."
                  className="w-full rounded-2xl border border-line bg-canvas/40 p-4 text-sm leading-6 text-ink placeholder:text-muted/70 focus:border-brand focus:bg-white focus:outline-2 focus:outline-brand/30"
                />

                <div className="mt-2 flex justify-between gap-3 text-xs text-muted">
                  <span>Be specific and avoid including unnecessary personal information.</span>
                  <span className="shrink-0">
                    {whatHappened.length} characters
                  </span>
                </div>
              </div>
            </section>

            <AiSuggestionPanel
              aiSuggesting={aiSuggesting}
              aiSuggestion={aiSuggestion}
              aiError={aiError}
              image={image}
              whatHappened={whatHappened}
              onUseSummary={(summary) => {
                setWhatHappened(summary)
                setSubmitError(null)
                if (debounceTimer.current) clearTimeout(debounceTimer.current)
                debounceTimer.current = setTimeout(() => {
                  triggerAiSuggestion(summary, location, whenText, image)
                }, 500)
              }}
            />

            <PhotoEvidenceCard
              image={image}
              requirement={requiresPhoto ? 'required' : recommendsPhoto ? 'recommended' : 'optional'}
              exceptionReason={photoExceptionReason}
              onExceptionReasonChange={setPhotoExceptionReason}
              notice={imageNotice}
              onDismissNotice={() => setImageNotice('')}
              onFileChange={handleImageChange}
              onRemove={removeImage}
            />

            <CategoryPicker
              categories={categories}
              selectedCategories={selectedAiCategories}
            />

            <div className="flex justify-end rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
              <Button
                type="button"
                size="lg"
                onClick={continueToDetails}
                className="w-full justify-center gap-2 sm:w-auto"
              >
                Continue to details
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Location and timeframe */}
        {step === 2 && (
          <div className="space-y-5">
            <section className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <MapPin className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-ink sm:text-xl">
                    Where and when did it happen?
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Help the relevant team identify the affected area and
                    understand when the issue occurred.
                  </p>
                </div>
              </div>
            </section>

            <LocationField
              location={location}
              onChange={setLocation}
              onOpenMap={() => setIsMapModalOpen(true)}
            />

            <WhenField
              whenText={whenText}
              onChange={setWhenText}
            />

            <div className="flex flex-col-reverse justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm sm:flex-row sm:p-5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSubmitError(null)
                  setStep(1)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <Button
                type="button"
                size="lg"
                onClick={continueToReview}
                className="justify-center gap-2"
              >
                Review complaint
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Final review */}
        {step === 3 && (
          <div className="space-y-5">
            <section className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-7">
              <Badge tone="accent" caps>
                Final review
              </Badge>

              <h2 className="mt-3 text-xl font-bold text-ink sm:text-2xl">
                Check your complaint
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted">
                Confirm that the details below are correct before submitting
                your report.
              </p>

              <div className="mt-5">
                <ReviewRow label="Category">
                  <div className="flex flex-wrap gap-2">
                    {(aiSuggestion ? [aiSuggestion.category, ...(aiSuggestion.secondary_categories || [])] : []).map((item, index) => (
                      <span key={item} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${index === 0 ? 'bg-brand text-white' : 'border border-brand/20 bg-brand-soft/40 text-brand'}`}>
                        {index === 0 ? `Primary · ${item}` : `#${item.replaceAll(' ', '')}`}
                      </span>
                    ))}
                    {!aiSuggestion && 'Awaiting AI selection'}
                  </div>
                </ReviewRow>

                <ReviewRow label="Priority">
                  {priority || aiSuggestion?.priority || 'Medium'}
                </ReviewRow>

                <ReviewRow label="Description">
                  <p className="whitespace-pre-wrap">
                    {whatHappened || 'No description provided.'}
                  </p>
                </ReviewRow>

                <ReviewRow label="Location">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-brand" />
                    <span>{location || 'Not provided'}</span>
                  </div>
                </ReviewRow>

                <ReviewRow label="When it happened">
                  {whenText || 'Not provided'}
                </ReviewRow>

                <ReviewRow label="Photo evidence">
                  {image ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={image}
                        alt="Complaint evidence preview"
                        className="h-20 w-20 rounded-xl border border-line object-cover"
                      />
                      <span>Photo attached</span>
                    </div>
                  ) : (
                    <span className="text-muted">No photo attached</span>
                  )}
                </ReviewRow>
              </div>
            </section>

            <section className="rounded-2xl border border-brand/20 bg-brand-soft/30 p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div>
                  <p className="text-sm font-bold text-ink">
                    What happens next?
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Your complaint will be sent to WaKiL for processing.
                    Once the backend confirms successful submission, your
                    official ticket details will appear.
                  </p>
                </div>
              </div>
            </section>

            <div className="flex flex-col-reverse justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm sm:flex-row sm:p-5">
              <Button
                type="button"
                variant="ghost"
                disabled={submitting}
                onClick={() => {
                  setSubmitError(null)
                  setStep(2)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to details
              </Button>

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit complaint
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </form>

      {/* Keep the existing interactive map picker. */}
      <LocationPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialLocation={location}
        onConfirm={handleMapConfirm}
      />
    </div>
  )
}

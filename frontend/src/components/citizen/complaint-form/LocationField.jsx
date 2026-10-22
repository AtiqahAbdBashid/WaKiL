import { Crosshair, Loader2, Map, MapPin } from 'lucide-react'
import { useCurrentLocation } from '../../../hooks/useCurrentLocation'
import InlineNotice from '../../ui/InlineNotice'

const QUICK_LOCATIONS = ['Bukit Gasing', 'Seremban', 'Muar', 'Puteri Wangsa', 'Taman Tun Dr Ismail', 'Kota Damansara', 'Bukit Jalil', 'Puchong', 'Cheras', 'Shah Alam']

export default function LocationField({ location, onChange, onOpenMap }) {
  const { locate, locating, notice, clearNotice } = useCurrentLocation(onChange)

  return (
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
            onClick={onOpenMap}
            className="flex items-center gap-1.5 rounded-xl border border-brand/30 bg-brand-soft/70 px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white"
          >
            <Map className="h-3.5 w-3.5" />
            <span>Pin on Map</span>
          </button>
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-canvas/60 px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
          >
            {locating ? (
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
      <InlineNotice message={notice} onDismiss={clearNotice} className="mt-2" />

      <div className="mt-3">
        <input
          id="complaint-location"
          type="text"
          required
          value={location}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Taman Mawar (3.12050, 101.67020) or Jalan Bangsar"
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
              onClick={onOpenMap}
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
            onClick={() => onChange((prev) => (prev ? `${prev}, ${loc}` : loc))}
            className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink transition hover:border-brand hover:text-brand"
          >
            + {loc}
          </button>
        ))}
      </div>
    </section>
  )
}

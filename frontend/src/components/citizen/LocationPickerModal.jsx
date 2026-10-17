import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Check,
  Crosshair,
  Loader2,
  MapPin,
  Search,
  X,
} from 'lucide-react'
import Button from '../ui/Button'

// Default center: Lembah Pantai, Kuala Lumpur
const DEFAULT_CENTER = [3.1209, 101.6738]
const DEFAULT_ZOOM = 15

// Clean custom SVG pin icon to avoid Leaflet asset path issues in Vite
const pinIcon = L.divIcon({
  className: 'wakil-map-pin',
  html: `
    <div style="transform: translate(-50%, -100%);">
      <div style="background-color: #f0506e; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2.5px solid #ffffff;">
        <div style="width: 10px; height: 10px; background-color: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
      </div>
      <div style="width: 14px; height: 6px; background-color: rgba(0,0,0,0.25); border-radius: 50%; margin: -4px auto 0; filter: blur(1.5px);"></div>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
})

function parseLocationString(raw) {
  let lat = DEFAULT_CENTER[0]
  let lng = DEFAULT_CENTER[1]
  let name = ''

  if (raw) {
    const match = raw.match(/\(([-+]?\d*\.?\d+),\s*([-+]?\d*\.?\d+)\)/)
    if (match) {
      lat = parseFloat(match[1])
      lng = parseFloat(match[2])
      name = raw.replace(/\s*\([^)]*\)/, '').trim()
    } else {
      name = raw.trim()
    }
  }

  return { lat, lng, name }
}

export default function LocationPickerModal({
  isOpen,
  onClose,
  initialLocation = null,
  onConfirm,
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)

  const [coords, setCoords] = useState(null)
  const [addressName, setAddressName] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [locatingCurrent, setLocatingCurrent] = useState(false)

  // Reverse geocoding via OpenStreetMap Nominatim
  const reverseGeocode = useCallback(async (lat, lng) => {
    setGeocoding(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'ms, en',
          },
        },
      )
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
          'Kawasan Kejadian'

        const area = addr.suburb || addr.city || addr.town || addr.state || ''
        const fullPlace = area && area !== primary ? `${primary}, ${area}` : primary

        setAddressName(fullPlace)
      } else {
        setAddressName((prev) => prev || 'Lokasi Terpilih')
      }
    } catch {
      setAddressName((prev) => prev || 'Lokasi Terpilih')
    } finally {
      setGeocoding(false)
    }
  }, [])

  const updateCoordinates = useCallback(
    (lat, lng) => {
      setCoords({ lat, lng })
      reverseGeocode(lat, lng)
    },
    [reverseGeocode],
  )

  useEffect(() => {
    if (!isOpen) return

    const parsed = parseLocationString(initialLocation)
    const startLat = parsed.lat
    const startLng = parsed.lng
    const startName = parsed.name

    const timer = setTimeout(() => {
      setCoords({ lat: startLat, lng: startLng })
      setAddressName(startName)

      if (!mapContainerRef.current) return

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }

      const map = L.map(mapContainerRef.current, {
        center: [startLat, startLng],
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      const marker = L.marker([startLat, startLng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map)

      marker.on('dragend', (e) => {
        const newPos = e.target.getLatLng()
        updateCoordinates(newPos.lat, newPos.lng)
      })

      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        updateCoordinates(lat, lng)
      })

      mapInstanceRef.current = map
      markerRef.current = marker

      // If no initial place name, reverse geocode the starting point
      if (!startName) {
        reverseGeocode(startLat, startLng)
      }

      setTimeout(() => map.invalidateSize(), 200)
    }, 50)

    return () => {
      clearTimeout(timer)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isOpen, initialLocation, reverseGeocode, updateCoordinates])

  // Handle current location GPS
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }

    setLocatingCurrent(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingCurrent(false)
        const { latitude, longitude } = pos.coords
        setCoords({ lat: latitude, lng: longitude })

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 17)
          markerRef.current.setLatLng([latitude, longitude])
        }

        reverseGeocode(latitude, longitude)
      },
      (err) => {
        setLocatingCurrent(false)
        alert(`Unable to retrieve your location: ${err.message}`)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  // Search places via Nominatim
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim() + ', Malaysia',
        )}&limit=5`,
      )
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data)
      }
    } catch {
      // ignore
    } finally {
      setSearching(false)
    }
  }

  const selectSearchResult = (item) => {
    const lat = parseFloat(item.lat)
    const lng = parseFloat(item.lon)

    setSearchResults([])
    setSearchQuery('')
    setCoords({ lat, lng })

    const parts = item.display_name.split(',')
    const shortName = parts.slice(0, 2).join(',').trim()
    setAddressName(shortName)

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 17)
      markerRef.current.setLatLng([lat, lng])
    }
  }

  const handleConfirmLocation = () => {
    if (!coords) return
    const name = addressName.trim() || 'Lokasi Terpilih'
    // Format: "Taman Mawar (lat, long)"
    const formatted = `${name} (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`
    onConfirm({
      formatted,
      name,
      lat: coords.lat,
      lng: coords.lng,
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-soft text-accent-dark">
              <MapPin className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-ink sm:text-lg">Pin Location on Map</h2>
              <p className="text-xs text-muted">Click or drag the pin to mark the exact location</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-canvas hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & GPS Tool Bar */}
        <div className="border-b border-line/60 bg-canvas/40 px-4 py-2.5 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search street, taman, or landmark..."
                className="w-full rounded-xl border border-line bg-white py-2 pl-9 pr-20 text-xs sm:text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none"
              />
              <button
                type="submit"
                disabled={searching}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg bg-brand px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
              >
                {searching ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Search'}
              </button>

              {/* Search results dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-[1000] mt-1 max-h-48 overflow-y-auto rounded-xl border border-line bg-white shadow-card">
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectSearchResult(item)}
                      className="block w-full border-b border-line/40 px-3 py-2 text-left text-xs text-ink hover:bg-canvas last:border-none"
                    >
                      <span className="font-semibold">{item.display_name.split(',')[0]}</span>
                      <span className="text-muted block text-[11px] truncate">{item.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </form>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locatingCurrent}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink shadow-sm transition hover:border-brand hover:text-brand disabled:opacity-50"
            >
              {locatingCurrent ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Crosshair className="h-3.5 w-3.5 text-accent" />
              )}
              <span>My Current Location</span>
            </button>
          </div>
        </div>

        {/* Map Canvas */}
        <div className="relative min-h-[340px] flex-1 bg-slate-100 sm:min-h-[420px]">
          <div ref={mapContainerRef} className="h-full w-full" style={{ minHeight: '340px' }} />

          {/* Real-time Address Card Overlay */}
          <div className="absolute bottom-3 left-3 right-3 z-[999] rounded-2xl border border-line/80 bg-white/95 p-3.5 shadow-card backdrop-blur-md sm:bottom-4 sm:left-4 sm:right-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    Selected Location
                  </span>
                  {geocoding && <Loader2 className="h-3 w-3 animate-spin text-brand" />}
                </div>
                <p className="mt-0.5 truncate text-sm font-extrabold text-ink sm:text-base">
                  {addressName || (geocoding ? 'Detecting address...' : 'Move pin to select place')}
                </p>
                {coords && (
                  <p className="mt-0.5 font-mono text-[11px] text-muted">
                    Coordinates: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirmLocation}
                disabled={!coords}
                className="gap-1.5 shrink-0"
              >
                <Check className="h-4 w-4" />
                <span>Confirm Pin</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


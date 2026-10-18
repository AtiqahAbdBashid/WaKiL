import { useState } from 'react'

// Reverse-geocodes the browser's position into "Place (lat, lng)", the format the
// backend parses coordinates from. Falls back to a generic name if lookup fails.
export function useCurrentLocation(onLocated) {
  const [locating, setLocating] = useState(false)
  const [notice, setNotice] = useState('')

  const locate = () => {
    if (!navigator.geolocation) {
      setNotice('Geolocation is not supported by your browser.')
      return
    }

    setNotice('')
    setLocating(true)
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
          onLocated(`${placeName} (${lat.toFixed(5)}, ${lng.toFixed(5)})`)
        } catch {
          onLocated(`Current location (${lat.toFixed(5)}, ${lng.toFixed(5)})`)
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        setLocating(false)
        setNotice(`Unable to get current location: ${err.message}`)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return { locate, locating, notice, clearNotice: () => setNotice('') }
}

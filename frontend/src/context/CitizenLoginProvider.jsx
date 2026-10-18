import { useMemo, useState } from 'react'

import CitizenLoginDialog from '../components/landing/CitizenLoginDialog'
import { CitizenLoginContext } from './citizenLoginState'

// Lets any landing component open the citizen login popup without a route change.
export function CitizenLoginProvider({ children }) {
  const [open, setOpen] = useState(false)
  const value = useMemo(() => ({ openCitizenLogin: () => setOpen(true) }), [])

  return (
    <CitizenLoginContext.Provider value={value}>
      {children}
      <CitizenLoginDialog open={open} onClose={() => setOpen(false)} />
    </CitizenLoginContext.Provider>
  )
}

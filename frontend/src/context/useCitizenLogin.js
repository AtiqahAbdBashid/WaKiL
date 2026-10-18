import { useContext } from 'react'

import { CitizenLoginContext } from './citizenLoginState'

export function useCitizenLogin() {
  const ctx = useContext(CitizenLoginContext)
  if (!ctx) throw new Error('useCitizenLogin must be used inside CitizenLoginProvider')
  return ctx
}

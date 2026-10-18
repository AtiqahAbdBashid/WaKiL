import { useMemo, useState } from 'react'

import { LanguageContext } from './languageState'

// The toggle only stores the choice; copy is English-only for now.
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en')
  const value = useMemo(() => ({ language, setLanguage }), [language])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

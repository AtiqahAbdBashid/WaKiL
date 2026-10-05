import { BrowserRouter } from 'react-router-dom'

import { LanguageProvider } from './context/LanguageContext'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </LanguageProvider>
  )
}

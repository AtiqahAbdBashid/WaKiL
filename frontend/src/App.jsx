import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import Header from './components/ui/Header';

export default function App() {
 return (
    <div className="min-h-screen bg-slate-50">
      <Header
        language="bm"
        setLanguage={() => {}}
        onMobileMenu={() => {}}
      />
      <div className="p-6">
        <h1 className="text-lg font-bold text-slate-800">App Content</h1>
      </div>
    </div>
  );
}

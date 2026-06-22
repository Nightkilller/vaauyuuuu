import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import PriorityView from './pages/PriorityView'

function App() {
  const [city, setCity] = useState(() => localStorage.getItem('selected_city') || 'Delhi')

  const handleCityChange = (newCity) => {
    setCity(newCity)
    localStorage.setItem('selected_city', newCity)
  }

  return (
    <Router>
      <div className="h-screen w-screen flex bg-slate-50 overflow-hidden">
        {/* Premium Sidebar */}
        <Sidebar />
        
        {/* Page Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard currentCity={city} onCityChange={handleCityChange} />} />
            <Route path="/priority" element={<PriorityView currentCity={city} onCityChange={handleCityChange} />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

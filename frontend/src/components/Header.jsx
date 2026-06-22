import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Header({ currentCity, onCityChange }) {
  const location = useLocation()
  const [showAbout, setShowAbout] = useState(false)

  return (
    <>
      <header className="bg-primary-950 text-white shadow-lg relative z-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo, Brand & Selector Group */}
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:shadow-sky-500/40 transition-shadow">
                  <span className="text-lg">🌬️</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight leading-none">
                    Vaayu<span className="text-sky-400">Lens</span> AI
                  </h1>
                  <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                    {currentCity} Air Quality Intelligence
                  </p>
                </div>
              </Link>

              {/* Styled City Selector */}
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 transition rounded-xl px-3 py-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">City:</span>
                <select
                  value={currentCity}
                  onChange={(e) => onCityChange(e.target.value)}
                  className="bg-transparent text-white text-xs font-extrabold focus:outline-none cursor-pointer [&>option]:text-slate-800"
                >
                  <option value="Delhi">Delhi NCT</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bengaluru">Bengaluru</option>
                </select>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === '/'
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="mr-1.5">🗺️</span> Map
              </Link>
              <Link
                to="/priority"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === '/priority'
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="mr-1.5">📊</span> Priority
              </Link>
              <button
                onClick={() => setShowAbout(true)}
                className="ml-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <span className="mr-1">ℹ️</span> About
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAbout(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-fade-in">
            <button
              onClick={() => setShowAbout(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
            >
              ✕
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
                <span className="text-xl">🌬️</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">About VaayuLens AI</h2>
                <p className="text-sm text-slate-500">Prototype v1.0</p>
              </div>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <p>
                <strong className="text-slate-800">VaayuLens AI</strong> is a hyperlocal urban air quality
                intelligence platform for Delhi, Mumbai, and Bengaluru, built for hackathon demonstration.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="font-semibold text-amber-800 mb-1">📊 Data Transparency</p>
                <p className="text-amber-700 text-xs">
                  This demo uses <strong>realistic synthetic data</strong> generated to match real air quality
                  patterns for each city (coastal sea breeze dynamics for Mumbai, high-altitude moderate patterns
                  for Bengaluru, and extreme thermal inversion spikes for Delhi). The ML models and SHAP
                  explanations are trained on these multi-city datasets. The architecture supports swapping
                  to live CPCB/CAAQMS feeds.
                </p>
              </div>
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                <p className="font-semibold text-sky-800 mb-1">🧠 How It Works</p>
                <ul className="text-sky-700 text-xs space-y-1 list-disc list-inside">
                  <li>LightGBM model forecasts PM2.5 at 24h, 48h, 72h horizons</li>
                  <li>SHAP TreeExplainer provides factor-level attribution</li>
                  <li>Priority scoring = forecasted AQI severity × population exposure</li>
                  <li>Template-based health advisories per ward</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

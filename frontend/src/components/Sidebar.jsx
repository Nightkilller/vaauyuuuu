import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Sidebar() {
  const location = useLocation()
  const [showAbout, setShowAbout] = useState(false)

  const menuItems = [
    {
      path: '/',
      icon: '🗺️',
      label: 'Map Monitor',
      tooltip: 'Air Quality Map'
    },
    {
      path: '/priority',
      icon: '📊',
      label: 'Priority Rankings',
      tooltip: 'Enforcement Priority'
    }
  ]

  return (
    <>
      <aside className="w-18 bg-white border-r border-slate-200 flex flex-col items-center justify-between py-6 z-50">
        {/* Brand Logo */}
        <div className="flex flex-col items-center gap-1">
          <Link to="/" className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-md shadow-sky-500/10 hover:scale-105 transition duration-300">
            <span className="text-xl">🌬️</span>
          </Link>
          <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider mt-1">Vaayu</span>
        </div>

        {/* Navigation Actions */}
        <nav className="flex flex-col gap-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.tooltip}
                className={`relative group w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {/* Tooltip */}
                <div className="absolute left-14 scale-0 group-hover:scale-100 transition-all origin-left bg-slate-950 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => setShowAbout(true)}
            className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition group relative"
            title="About Platform"
          >
            <span className="text-base">ℹ️</span>
            <div className="absolute left-14 scale-0 group-hover:scale-100 transition-all origin-left bg-slate-950 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
              About Platform
            </div>
          </button>
        </div>
      </aside>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAbout(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-fade-in border border-slate-100">
            <button
              onClick={() => setShowAbout(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition font-bold"
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
            <div className="space-y-4 text-sm text-slate-600">
              <p>
                <strong className="text-slate-800">VaayuLens AI</strong> is a hyperlocal urban air quality
                intelligence platform for Delhi, Mumbai, and Bengaluru, built for hackathon demonstration.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="font-semibold text-amber-800 mb-1">📊 Data Transparency</p>
                <p className="text-amber-700 text-xs leading-relaxed">
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

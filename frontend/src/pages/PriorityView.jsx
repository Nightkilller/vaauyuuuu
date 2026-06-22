import PriorityRankingTable from '../components/PriorityRankingTable'

/**
 * Full-page enforcement priority ranking view.
 */
export default function PriorityView({ currentCity, onCityChange }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 h-full overflow-y-auto">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-lg shadow-lg shadow-orange-500/20">
              📊
            </span>
            Enforcement Priority Ranking — {currentCity}
          </h1>

          {/* City Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 shadow-sm rounded-xl px-3 py-1.5 mr-[12px] lg:mr-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">City:</span>
            <select
              value={currentCity}
              onChange={(e) => onCityChange(e.target.value)}
              className="bg-transparent text-slate-700 text-xs font-extrabold focus:outline-none cursor-pointer"
            >
              <option value="Delhi">Delhi NCT</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bengaluru">Bengaluru</option>
            </select>
          </div>
        </div>
        <p className="text-sm text-slate-500 mt-2 ml-[52px]">
          Wards ranked by <strong>forecasted AQI severity × population exposure</strong> in {currentCity}.
          Higher priority score = more urgent enforcement action needed.
        </p>
      </div>

      {/* Priority explanation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 ml-[52px]">
        <div className="glass-card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Formula</p>
          <p className="text-sm text-slate-700 font-mono">Score = AQI × (Pop / 100k)</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Data Source</p>
          <p className="text-sm text-slate-700">HistGBM 24h forecast</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Updated</p>
          <p className="text-sm text-slate-700">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden ml-[52px]">
        <PriorityRankingTable currentCity={currentCity} />
      </div>
    </div>
  )
}

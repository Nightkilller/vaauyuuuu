import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPriorityRanking, fetchWards } from '../api/client'
import { getAqiInfo, getAqiColor } from '../utils/aqiColors'
import { formatPopulation, formatScore } from '../utils/formatters'

/**
 * Sortable priority ranking table.
 * Columns: Rank, Ward, Current AQI, Forecasted AQI (24h), Population, Priority Score
 */
export default function PriorityRankingTable({ currentCity }) {
  const [rankings, setRankings] = useState([])
  const [wards, setWards] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState('priority_score')
  const [sortDir, setSortDir] = useState('desc')
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchPriorityRanking(currentCity), fetchWards(currentCity)])
      .then(([rankRes, wardRes]) => {
        setRankings(rankRes.rankings || [])
        setWards(wardRes.wards || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [currentCity])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const sorted = [...rankings].sort((a, b) => {
    const aVal = a[sortField] ?? 0
    const bVal = b[sortField] ?? 0
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal
  })

  const SortIcon = ({ field }) => (
    <span className="ml-1 text-[10px] text-slate-400">
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  if (loading) {
    return (
      <div className="space-y-3 p-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ward / Station
            </th>
            <th
              className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition"
              onClick={() => handleSort('current_aqi')}
            >
              Current AQI <SortIcon field="current_aqi" />
            </th>
            <th
              className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition"
              onClick={() => handleSort('forecast_aqi_24h')}
            >
              24h Forecast <SortIcon field="forecast_aqi_24h" />
            </th>
            <th
              className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition"
              onClick={() => handleSort('population')}
            >
              Population <SortIcon field="population" />
            </th>
            <th
              className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition"
              onClick={() => handleSort('priority_score')}
            >
              Priority Score <SortIcon field="priority_score" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, idx) => {
            const aqiInfo = getAqiInfo(item.current_aqi)
            const forecastInfo = getAqiInfo(item.forecast_aqi_24h)
            const ward = wards.find(w => w.ward_id === item.ward_id)

            return (
              <tr
                key={item.ward_id}
                className="border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer"
                onClick={() => navigate(`/?ward=${item.ward_id}`)}
              >
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                    idx < 3 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {idx + 1}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">{item.ward_name || ward?.name}</p>
                  <p className="text-xs text-slate-400">{ward?.zone} {ward?.city || 'Delhi'}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold"
                    style={{
                      backgroundColor: aqiInfo.color + '20',
                      color: aqiInfo.color === '#ffff00' ? '#854d0e' : aqiInfo.color,
                    }}
                  >
                    {Math.round(item.current_aqi)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold"
                    style={{
                      backgroundColor: forecastInfo.color + '20',
                      color: forecastInfo.color === '#ffff00' ? '#854d0e' : forecastInfo.color,
                    }}
                  >
                    {Math.round(item.forecast_aqi_24h)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-600">
                  {formatPopulation(item.population)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-slate-800">
                    {formatScore(item.priority_score)}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

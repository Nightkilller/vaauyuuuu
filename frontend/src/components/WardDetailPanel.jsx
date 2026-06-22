import { useState, useEffect } from 'react'
import { fetchWardForecast, fetchAttribution, fetchAdvisory } from '../api/client'
import { getAqiInfo } from '../utils/aqiColors'
import { formatPM25, formatPopulation } from '../utils/formatters'
import ForecastTrendChart from './ForecastTrendChart'
import ShapAttributionChart from './ShapAttributionChart'
import CitizenAdvisoryCard from './CitizenAdvisoryCard'

/**
 * Slide-in detail panel for a selected ward.
 * Shows current AQI, 72h forecast chart, SHAP attribution, and health advisory.
 */
export default function WardDetailPanel({ wardId, ward, onClose, allForecasts = [] }) {
  const [forecast, setForecast] = useState(null)
  const [attribution, setAttribution] = useState(null)
  const [advisory, setAdvisory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!wardId) return

    setLoading(true)
    Promise.all([
      fetchWardForecast(wardId),
      fetchAttribution(wardId),
      fetchAdvisory(wardId),
    ])
      .then(([forecastRes, attrRes, advisoryRes]) => {
        setForecast(forecastRes)
        setAttribution(attrRes)
        setAdvisory(advisoryRes)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [wardId])

  if (!wardId) return null

  const aqiInfo = forecast ? getAqiInfo(forecast.current_aqi) : null

  // Calculate city-wide average for comparison
  const cityAvgAqi = allForecasts.length
    ? Math.round(allForecasts.reduce((sum, f) => sum + f.current_aqi, 0) / allForecasts.length)
    : 0

  const aqiDiff = forecast ? Math.round(forecast.current_aqi - cityAvgAqi) : 0

  return (
    <div className="fixed top-16 right-0 bottom-0 w-full sm:w-[440px] bg-white shadow-2xl z-40 animate-slide-in overflow-y-auto border-l border-slate-200">
      
      {/* Panel Sticky Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-5 py-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {ward?.name || wardId}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {ward?.zone} {ward?.city || 'Delhi'} • Pop. {formatPopulation(ward?.population_approx)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
          >
            ✕
          </button>
        </div>

        {/* AQI Indicator & Comparison Banner */}
        {!loading && forecast && aqiInfo && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="px-4 py-2 rounded-2xl font-black text-2xl shadow-sm"
                style={{
                  backgroundColor: aqiInfo.color + '18',
                  color: aqiInfo.color,
                  border: `2px solid ${aqiInfo.color}40`,
                }}
              >
                {Math.round(forecast.current_aqi)}
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-700">{aqiInfo.category}</p>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  Primary Pollutant PM2.5: {formatPM25(forecast.current_pm25)}
                </p>
              </div>
            </div>

            {/* Comparison Text */}
            <div className={`text-xs px-3 py-2 rounded-xl font-semibold border ${
              aqiDiff > 0 
                ? 'bg-red-50 border-red-100 text-red-700' 
                : (aqiDiff < 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-600')
            }`}>
              {aqiDiff > 0 ? (
                <span>⚠️ AQI is <strong>{aqiDiff}</strong> points higher than {ward?.city || 'Delhi'} average ({cityAvgAqi})</span>
              ) : aqiDiff < 0 ? (
                <span>🍀 AQI is <strong>{Math.abs(aqiDiff)}</strong> points lower than {ward?.city || 'Delhi'} average ({cityAvgAqi})</span>
              ) : (
                <span>📍 Equal to {ward?.city || 'Delhi'} average ({cityAvgAqi})</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="p-5 space-y-4">
          <div className="skeleton h-6 w-32" />
          <div className="skeleton h-48 w-full" />
          <div className="skeleton h-6 w-40" />
          <div className="skeleton h-40 w-full" />
        </div>
      )}

      {/* Main Content */}
      {!loading && forecast && (
        <div className="p-5 space-y-6">
          
          {/* Live Environmental Readings */}
          {forecast.weather && (
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                Live Meteorological Readings
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">🌡️ Temp</span>
                  <p className="text-sm font-extrabold text-slate-700 mt-1">{forecast.weather.temperature} °C</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">💧 Humidity</span>
                  <p className="text-sm font-extrabold text-slate-700 mt-1">{forecast.weather.humidity} %</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">🌬️ Wind Speed & Dir</span>
                    <p className="text-sm font-extrabold text-slate-700 mt-0.5">{forecast.weather.wind_speed} km/h</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg inline-block">
                      {forecast.weather.wind_direction}° S
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Forecast Trend Chart */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              72-Hour PM2.5 Forecast
            </h3>
            <div className="glass-card p-3">
              <ForecastTrendChart forecastData={forecast} />
            </div>
          </section>

          {/* Key Pollutants breakdown */}
          {forecast.pollutants && (
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                Other Key Pollutants
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'PM10', val: forecast.pollutants.pm10, limit: 100, unit: 'µg/m³' },
                  { name: 'NO2', val: forecast.pollutants.no2, limit: 80, unit: 'µg/m³' },
                  { name: 'SO2', val: forecast.pollutants.so2, limit: 80, unit: 'µg/m³' },
                  { name: 'CO', val: forecast.pollutants.co, limit: 2.0, unit: 'mg/m³' },
                ].map((pol) => {
                  const isSafe = pol.val !== null ? pol.val <= pol.limit : true
                  return (
                    <div key={pol.name} className="border border-slate-100 bg-slate-50/50 p-2.5 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-700">{pol.name}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Limit: {pol.limit}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-700">
                          {pol.val !== null ? pol.val : '—'}{' '}
                          <span className="text-[9px] font-normal text-slate-400">{pol.unit}</span>
                        </span>
                        <span className={`w-2 h-2 rounded-full inline-block ml-1.5 ${isSafe ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* SHAP Attribution Chart */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              Explainable Drivers (SHAP)
            </h3>
            <div className="glass-card p-3">
              <ShapAttributionChart attributionData={attribution} />
            </div>
          </section>

          {/* Health Advisory */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Actionable Health Advisory
            </h3>
            <CitizenAdvisoryCard advisory={advisory} />
          </section>
        </div>
      )}
    </div>
  )
}

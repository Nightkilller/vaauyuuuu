import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area
} from 'recharts'
import { getAqiColor } from '../utils/aqiColors'

/**
 * 72-hour PM2.5 forecast trend line chart.
 * Shows current value + forecasted values at 24h, 48h, 72h with AQI threshold lines.
 */
export default function ForecastTrendChart({ forecastData }) {
  if (!forecastData || !forecastData.trend) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
        No forecast data available
      </div>
    )
  }

  const data = forecastData.trend

  // AQI threshold reference lines
  const thresholds = [
    { value: 60,  label: 'Moderate', color: '#ffff00' },
    { value: 120, label: 'Poor',     color: '#ff9900' },
    { value: 250, label: 'V.Poor',   color: '#ff0000' },
  ]

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-xs text-slate-500 mb-1">{d.label}</p>
        <p className="text-lg font-bold text-slate-800">
          {Math.round(d.pm25)} <span className="text-xs font-normal text-slate-500">µg/m³</span>
        </p>
        <p className="text-xs mt-1" style={{ color: getAqiColor(d.aqi) }}>
          AQI {Math.round(d.aqi)}
        </p>
      </div>
    )
  }

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="pm25Gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
            label={{ value: 'PM2.5 (µg/m³)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#94a3b8' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {thresholds.map(t => (
            <ReferenceLine
              key={t.label}
              y={t.value}
              stroke={t.color}
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{ value: t.label, position: 'right', style: { fontSize: 9, fill: t.color } }}
            />
          ))}

          <Area
            type="monotone"
            dataKey="pm25"
            fill="url(#pm25Gradient)"
            stroke="none"
          />
          <Line
            type="monotone"
            dataKey="pm25"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 7, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

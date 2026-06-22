import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

/**
 * Horizontal bar chart showing SHAP attribution factors.
 * Bars are colored green (decreasing risk) or red (increasing risk).
 */
export default function ShapAttributionChart({ attributionData }) {
  if (!attributionData || !attributionData.factors || attributionData.factors.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
        No attribution data available
      </div>
    )
  }

  const data = attributionData.factors
    .slice(0, 6)
    .map(f => ({
      ...f,
      absValue: Math.abs(f.shap_value),
      displayValue: f.shap_value,
    }))
    .sort((a, b) => b.absValue - a.absValue)

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-sm font-semibold text-slate-800">{d.factor}</p>
        <p className="text-xs text-slate-500 mt-1">
          SHAP value: <strong>{d.shap_value.toFixed(2)}</strong>
        </p>
        <p className={`text-xs mt-0.5 font-medium ${d.direction === 'increasing' ? 'text-red-500' : 'text-emerald-500'}`}>
          {d.direction === 'increasing' ? '↑ Increasing' : '↓ Decreasing'} risk
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="factor"
              width={130}
              tick={{ fontSize: 11, fill: '#475569' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="absValue" radius={[0, 6, 6, 0]} barSize={16}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.direction === 'increasing' ? '#ef4444' : '#10b981'}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-4 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500 opacity-80" />
          <span className="text-[10px] text-slate-500">Increasing risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500 opacity-80" />
          <span className="text-[10px] text-slate-500">Decreasing risk</span>
        </div>
      </div>
    </div>
  )
}

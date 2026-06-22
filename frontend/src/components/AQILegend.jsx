import { AQI_BREAKPOINTS } from '../utils/aqiColors'

export default function AQILegend() {
  return (
    <div className="absolute bottom-6 left-4 z-[1000] glass-card px-4 py-3">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
        AQI Scale (CPCB)
      </p>
      <div className="flex gap-1">
        {AQI_BREAKPOINTS.map((bp) => (
          <div key={bp.category} className="flex flex-col items-center">
            <div
              className="w-8 h-3 rounded-sm"
              style={{ backgroundColor: bp.color }}
            />
            <span className="text-[9px] text-slate-500 mt-1 leading-tight text-center">
              {bp.min}-{bp.max}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[8px] text-slate-400">Good</span>
        <span className="text-[8px] text-slate-400">Severe</span>
      </div>
    </div>
  )
}

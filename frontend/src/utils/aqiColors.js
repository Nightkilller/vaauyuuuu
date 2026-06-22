/**
 * VaayuLens AI — AQI Color Utilities
 * Maps AQI values to colors and categories using official CPCB breakpoints.
 */

// CPCB AQI breakpoints and corresponding colors
const AQI_BREAKPOINTS = [
  { min: 0,   max: 50,  category: 'Good',         color: '#00b050', textColor: '#ffffff', bgClass: 'aqi-good' },
  { min: 51,  max: 100, category: 'Satisfactory',  color: '#92d050', textColor: '#1a1a1a', bgClass: 'aqi-satisfactory' },
  { min: 101, max: 200, category: 'Moderate',       color: '#ffff00', textColor: '#1a1a1a', bgClass: 'aqi-moderate' },
  { min: 201, max: 300, category: 'Poor',           color: '#ff9900', textColor: '#ffffff', bgClass: 'aqi-poor' },
  { min: 301, max: 400, category: 'Very Poor',      color: '#ff0000', textColor: '#ffffff', bgClass: 'aqi-verypoor' },
  { min: 401, max: 500, category: 'Severe',         color: '#800000', textColor: '#ffffff', bgClass: 'aqi-severe' },
]

/**
 * Get AQI category info for a given AQI value.
 * @param {number} aqi - AQI value (0-500+)
 * @returns {{ category: string, color: string, textColor: string, bgClass: string }}
 */
export function getAqiInfo(aqi) {
  if (aqi == null || isNaN(aqi)) {
    return AQI_BREAKPOINTS[0]
  }
  const val = Math.round(aqi)
  for (const bp of AQI_BREAKPOINTS) {
    if (val >= bp.min && val <= bp.max) return bp
  }
  // Above 500 → Severe
  return AQI_BREAKPOINTS[AQI_BREAKPOINTS.length - 1]
}

/**
 * Get just the hex color for an AQI value.
 */
export function getAqiColor(aqi) {
  return getAqiInfo(aqi).color
}

/**
 * Get the category label string.
 */
export function getAqiCategory(aqi) {
  return getAqiInfo(aqi).category
}

/**
 * Get circle marker radius scaled by AQI severity (for map markers).
 */
export function getMarkerRadius(aqi) {
  if (aqi <= 50) return 12
  if (aqi <= 100) return 14
  if (aqi <= 200) return 16
  if (aqi <= 300) return 18
  if (aqi <= 400) return 20
  return 22
}

export { AQI_BREAKPOINTS }

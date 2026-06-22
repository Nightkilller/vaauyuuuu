/**
 * VaayuLens AI — Formatting Utilities
 */

/**
 * Format a number with commas for population display.
 */
export function formatPopulation(num) {
  if (num == null) return '—'
  return new Intl.NumberFormat('en-IN').format(num)
}

/**
 * Format PM2.5 value with units.
 */
export function formatPM25(value) {
  if (value == null) return '—'
  return `${Math.round(value)} µg/m³`
}

/**
 * Format a date for display.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format forecast hour label (e.g., "+24h", "+48h").
 */
export function formatHorizon(hours) {
  return `+${hours}h`
}

/**
 * Format priority score for display.
 */
export function formatScore(score) {
  if (score == null) return '—'
  return score.toFixed(1)
}

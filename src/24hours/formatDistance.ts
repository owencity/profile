export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return '-'

  if (meters >= 1000) {
    const km = meters / 1000
    return `${km.toFixed(1)}km`
  }

  return `${Math.round(meters)}m`
}


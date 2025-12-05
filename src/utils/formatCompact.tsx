export const formatCompact = (value?: number | null) => {
  if (value === undefined || value === null) return '--'
  const abs = Math.abs(value)
  if (abs >= 1e9) return `${(value / 1e9).toFixed(1).replace(/\.0$/, '')}B`
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1).replace(/\.0$/, '')}M`
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1).replace(/\.0$/, '')}K`
  return `${value.toLocaleString('vi-VN')}₫`
}

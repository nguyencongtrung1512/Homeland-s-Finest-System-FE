export const formatCompact = (value?: number | null) => {
  if (value === undefined || value === null) return '--'
  const abs = Math.abs(value)
  if (abs >= 1e9) return `${(value / 1e9).toFixed(1).replace(/\.0$/, '')} tỷ`
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1).replace(/\.0$/, '')} tr`
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1).replace(/\.0$/, '')} nghìn`
  return `${value.toLocaleString('vi-VN')}đ`
}

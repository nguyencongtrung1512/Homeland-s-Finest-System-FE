// Prefer explicit base, fallback to origin of VITE_API_URL
const API_BASE = (() => {
  const explicit = import.meta.env.VITE_API_BASE_URL || ''
  if (explicit) return explicit
  const apiUrl = import.meta.env.VITE_API_URL || ''
  try {
    // Derive origin (protocol + host + optional port), strip trailing path like /api
    return apiUrl ? new URL(apiUrl, window.location.origin).origin : ''
  } catch {
    return ''
  }
})()

export const resolveImageUrl = (src?: string | null) => {
  if (!src) return ''
  const s = String(src).trim()
  if (s.startsWith('data:') || /^https?:\/\//i.test(s)) return s
  return `${API_BASE}${s.startsWith('/') ? s : '/' + s}`
}

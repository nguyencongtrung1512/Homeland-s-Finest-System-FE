// export const formatDate = (dateString: string) => {
//   if (!dateString || dateString === 'null' || dateString === 'undefined') {
//     return '-'
//   }

//   const timeDateMatch = dateString.match(/(\d{2}:\d{2}:\d{2})\s+(\d{2}\/\d{2}\/\d{4})/)

//   if (timeDateMatch) {
//     const [, time, date] = timeDateMatch
//     const [day, month, year] = date.split('/')
//     const [hours, minutes, seconds] = time.split(':')

//     const dateObj = new Date(
//       parseInt(year),
//       parseInt(month) - 1,
//       parseInt(day),
//       parseInt(hours),
//       parseInt(minutes),
//       parseInt(seconds)
//     )

//     if (isNaN(dateObj.getTime())) {
//       return '-'
//     }

//     return dateObj.toLocaleDateString('vi-VN', {
//       year: 'numeric',
//       month: '2-digit',
//       day: '2-digit'
//     })
//   }

//   const date = new Date(dateString)
//   if (isNaN(date.getTime())) {
//     return '-'
//   }

//   return date.toLocaleDateString('vi-VN', {
//     year: 'numeric',
//     month: '2-digit',
//     day: '2-digit'
//   })
// }
export const formatDate = (input?: string | number | Date | null) => {
  // 1) Normalize
  if (input === null || input === undefined) return '-'

  // Date object vào thẳng
  if (input instanceof Date) {
    return isNaN(input.getTime())
      ? '-'
      : input.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  // Chuỗi -> trim
  const s = typeof input === 'string' ? input.trim() : input

  // Rỗng/‘null’/‘undefined’/‘0’ coi như invalid
  if (s === '' || s === 'null' || s === 'undefined' || s === '0' || s === 0) return '-'

  // 2) Nếu là số hoặc chuỗi số -> timestamp
  if (typeof s === 'number' || /^[0-9]+$/.test(String(s))) {
    const n = Number(s)
    const ms = n < 1e12 ? n * 1000 : n // seconds -> ms
    const d = new Date(ms)
    return isNaN(d.getTime())
      ? '-'
      : d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  // 3) Định dạng "HH:mm:ss dd/MM/yyyy" từ BE
  const m = String(s).match(/(\d{2}):(\d{2}):(\d{2})\s+(\d{2})\/(\d{2})\/(\d{4})/)
  if (m) {
    const [, hh, mm, ss, dd, MM, yyyy] = m
    const d = new Date(+yyyy, +MM - 1, +dd, +hh, +mm, +ss)
    return isNaN(d.getTime())
      ? '-'
      : d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  // ISO hoặc format khác mà JS parse được
  const d = new Date(String(s))
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export const formatDateTime = (input?: string | number | Date | null) => {
  // 1) Normalize
  if (input === null || input === undefined) return '-'

  // Date object vào thẳng
  if (input instanceof Date) {
    if (isNaN(input.getTime())) return '-'
    const dateStr = input.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    const timeStr = input.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    return `${dateStr} ${timeStr}`
  }

  // Chuỗi -> trim
  const s = typeof input === 'string' ? input.trim() : input

  // Rỗng/'null'/'undefined'/'0' coi như invalid
  if (s === '' || s === 'null' || s === 'undefined' || s === '0' || s === 0) return '-'

  // 2) Nếu là số hoặc chuỗi số -> timestamp
  if (typeof s === 'number' || /^[0-9]+$/.test(String(s))) {
    const n = Number(s)
    const ms = n < 1e12 ? n * 1000 : n // seconds -> ms
    const d = new Date(ms)
    if (isNaN(d.getTime())) return '-'
    const dateStr = d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    return `${dateStr} ${timeStr}`
  }

  // 3) Định dạng "HH:mm:ss dd/MM/yyyy" từ BE
  const m = String(s).match(/(\d{2}):(\d{2}):(\d{2})\s+(\d{2})\/(\d{2})\/(\d{4})/)
  if (m) {
    const [, hh, mm, ss, dd, MM, yyyy] = m
    const d = new Date(+yyyy, +MM - 1, +dd, +hh, +mm, +ss)
    if (isNaN(d.getTime())) return '-'
    const dateStr = d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    return `${dateStr} ${timeStr}`
  }

  // ISO hoặc format khác mà JS parse được
  const d = new Date(String(s))
  if (isNaN(d.getTime())) return '-'
  const dateStr = d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return `${dateStr} ${timeStr}`
}

export const formatDateAndTime = (input?: string | number | Date | null): { date: string; time: string } | null => {
  // 1) Normalize
  if (input === null || input === undefined) return null

  let dateObj: Date | null = null

  // Date object vào thẳng
  if (input instanceof Date) {
    if (isNaN(input.getTime())) return null
    dateObj = input
  } else {
    // Chuỗi -> trim
    const s = typeof input === 'string' ? input.trim() : input

    // Rỗng/'null'/'undefined'/'0' coi như invalid
    if (s === '' || s === 'null' || s === 'undefined' || s === '0' || s === 0) return null

    // 2) Nếu là số hoặc chuỗi số -> timestamp
    if (typeof s === 'number' || /^[0-9]+$/.test(String(s))) {
      const n = Number(s)
      const ms = n < 1e12 ? n * 1000 : n // seconds -> ms
      dateObj = new Date(ms)
      if (isNaN(dateObj.getTime())) return null
    }
    // 3) Định dạng "HH:mm:ss dd/MM/yyyy" từ BE
    else {
      const m = String(s).match(/(\d{2}):(\d{2}):(\d{2})\s+(\d{2})\/(\d{2})\/(\d{4})/)
      if (m) {
        const [, hh, mm, ss, dd, MM, yyyy] = m
        dateObj = new Date(+yyyy, +MM - 1, +dd, +hh, +mm, +ss)
        if (isNaN(dateObj.getTime())) return null
      } else {
        // ISO hoặc format khác mà JS parse được
        dateObj = new Date(String(s))
        if (isNaN(dateObj.getTime())) return null
      }
    }
  }

  const dateStr = dateObj.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return { date: dateStr, time: timeStr }
}

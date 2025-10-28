export const formatDate = (dateString: string) => {
  if (!dateString || dateString === 'null' || dateString === 'undefined') {
    return '-'
  }

  const timeDateMatch = dateString.match(/(\d{2}:\d{2}:\d{2})\s+(\d{2}\/\d{2}\/\d{4})/)

  if (timeDateMatch) {
    const [, time, date] = timeDateMatch
    const [day, month, year] = date.split('/')
    const [hours, minutes, seconds] = time.split(':')

    const dateObj = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    )

    if (isNaN(dateObj.getTime())) {
      return '-'
    }

    return dateObj.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
import { notFound } from 'next/navigation'
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 นาที'

  const h = Math.floor(minutes / 60)
  const m = minutes % 60

  if (h === 0) return `${m} นาที`
  if (m === 0) return `${h} ชม.`

  return `${h} ชม. ${m} นาที`
}

export function validateSlug(slug: string | undefined) {
  if (!slug) return notFound()
  const decoded = decodeURIComponent(slug)
  if (decoded === 'undefined' || decoded === '') {
    return notFound()
  }
  return decoded
}

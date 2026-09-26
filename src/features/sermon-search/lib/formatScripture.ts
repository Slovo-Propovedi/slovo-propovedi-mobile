import { formatSermonReference, type SermonData } from 'entities/sermon'

export const formatScripture = (sermon: SermonData): null | string => {
  // Preserve legacy UI behavior: hide the scripture line when there is no book name
  if (!sermon.book) return null

  const reference = formatSermonReference({
    book: sermon.book,
    chapter: sermon.chapter,
    verse: sermon.verse,
  })

  return reference ?? null
}

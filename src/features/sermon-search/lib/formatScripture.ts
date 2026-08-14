import type { SermonData } from 'shared/model'

const joinVerse = (verse: NonNullable<SermonData['verse']>): string =>
  Array.isArray(verse) ? verse.join(',') : String(verse)

export const formatScripture = (sermon: SermonData): null | string => {
  const { book, chapter, verse } = sermon
  if (!book) return null

  if (chapter != null && verse != null) return `${book} ${chapter}:${joinVerse(verse)}`
  if (chapter != null) return `${book} ${chapter}`
  if (verse != null) return `${book} ${joinVerse(verse)}`

  return book
}

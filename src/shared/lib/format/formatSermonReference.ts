interface FormatSermonReferenceParams {
  book?: null | string | undefined
  chapter?: null | number | undefined
  verse?: null | number | number[] | undefined
}

const formatVerse = (verse: null | number | number[] | undefined): string | undefined => {
  if (verse === null || verse === undefined) return undefined

  if (typeof verse === 'number') return String(verse)

  if (verse.length === 0) return undefined
  if (verse.length === 1) return String(verse[0])

  return `${verse[0]}-${verse[verse.length - 1]}`
}

export const formatSermonReference = ({
  book,
  chapter,
  verse,
}: FormatSermonReferenceParams): string | undefined => {
  const verseText = formatVerse(verse)
  const chapterText = typeof chapter === 'number' ? String(chapter) : undefined

  const parts: string[] = []

  if (book) parts.push(book)

  if (chapterText) parts.push(verseText ? `${chapterText}:${verseText}` : chapterText)
  else if (verseText) parts.push(verseText)

  const reference = parts.join(' ')

  return reference || undefined
}

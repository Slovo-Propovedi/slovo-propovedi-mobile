import { type SermonData } from 'shared/model'

interface FormatSermonReferenceParams {
  book?: SermonData['book']
  chapter?: SermonData['chapter']
  verse?: SermonData['verse']
}

const formatRange = (range: number[]): string | undefined => {
  if (range.length === 0) return undefined
  if (range.length === 1) return String(range[0])

  return `${range[0]}-${range[range.length - 1]}`
}

const formatChapter = (chapter: SermonData['chapter']): string | undefined => {
  if (chapter === null || chapter === undefined) return undefined
  if (typeof chapter === 'number') return String(chapter)

  return formatRange(chapter)
}

const formatVerseItem = (item: number | number[]): string | undefined => {
  if (typeof item === 'number') return String(item)

  return formatRange(item)
}

// Ровно два числа — диапазон; иначе — список отрезков
const isVerseRange = (verse: (number | number[])[]): verse is number[] =>
  verse.length === 2 && verse.every(item => typeof item === 'number')

const formatVerse = (verse: SermonData['verse']): string | undefined => {
  if (verse === null || verse === undefined) return undefined
  if (typeof verse === 'number') return String(verse)

  if (isVerseRange(verse)) return formatRange(verse)

  const items = verse.map(formatVerseItem).filter((item): item is string => item !== undefined)

  return items.length === 0 ? undefined : items.join(', ')
}

export const formatSermonReference = ({
  book,
  chapter,
  verse,
}: FormatSermonReferenceParams): string | undefined => {
  const verseText = formatVerse(verse)
  const chapterText = formatChapter(chapter)

  const parts: string[] = []

  if (book) parts.push(book)

  if (chapterText) parts.push(verseText ? `${chapterText}:${verseText}` : chapterText)
  else if (verseText) parts.push(verseText)

  const reference = parts.join(' ')

  return reference || undefined
}

import { type APITypes } from 'shared/api'
import { getMediaFileKind, isDeletableOrphan, type MediaFileKind } from './fileKind'

const file = (fileName: string): APITypes.FileMetadataDto => ({
  fileName,
  fileUrl: `https://cdn.test/${fileName}`,
  lastModified: null,
  size: 1024,
  used: false,
})

const CASES: Array<[string, MediaFileKind]> = [
  ['sermon.mp3', 'audio'],
  ['sermon.M4A', 'audio'],
  ['doc.pdf', 'text'],
  ['book.fb2', 'text'],
  ['cover.jpg', 'image'],
  ['art.webp', 'image'],
]

describe('getMediaFileKind', () => {
  test.each(CASES)('classifies %s as %s', (fileName, expected) => {
    expect(getMediaFileKind(fileName)).toBe(expected)
  })

  test('treats m4a orphans as deletable audio, not images', () => {
    expect(isDeletableOrphan(file('orphan.m4a'))).toBe(true)
    expect(isDeletableOrphan(file('cover.jpg'))).toBe(false)
  })
})

import { detectFileKind } from './fileKinds'

describe('detectFileKind', () => {
  test('classifies files by extension', () => {
    expect(detectFileKind('cover.jpg')).toBe('image')
    expect(detectFileKind('sermon.mp3')).toBe('audio')
    expect(detectFileKind('sermon.m4a')).toBe('audio')
    expect(detectFileKind('text.fb2')).toBe('text')
    expect(detectFileKind('doc.pdf')).toBe('text')
    expect(detectFileKind('notes.txt')).toBe('text')
  })

  test('falls back to the mime type when the extension is unknown', () => {
    expect(detectFileKind('photo', 'image/png')).toBe('image')
    expect(detectFileKind('recording', 'audio/mpeg')).toBe('audio')
    expect(detectFileKind('document', 'application/pdf')).toBe('text')
  })

  test('returns null for unknown files', () => {
    expect(detectFileKind('archive.zip')).toBeNull()
    expect(detectFileKind('archive.zip', 'application/zip')).toBeNull()
  })
})

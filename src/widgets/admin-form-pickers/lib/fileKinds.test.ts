import { getFileKindConfig, isAllowedExtension } from './fileKinds'

describe('isAllowedExtension', () => {
  test('accepts mp3 and m4a for the audio kind and rejects other extensions', () => {
    expect(isAllowedExtension('audio', 'sermon.mp3')).toBe(true)
    expect(isAllowedExtension('audio', 'sermon.m4a')).toBe(true)
    expect(isAllowedExtension('audio', 'SERMON.M4A')).toBe(true)
    expect(isAllowedExtension('audio', 'sermon.wav')).toBe(false)
  })

  test('accepts any extension for the text kind (no restriction)', () => {
    expect(isAllowedExtension('text', 'sermon.docx')).toBe(true)
  })

  test('accepts common image extensions for the image kind', () => {
    expect(isAllowedExtension('image', 'cover.webp')).toBe(true)
    expect(isAllowedExtension('image', 'cover.gif')).toBe(false)
  })
})

describe('getFileKindConfig', () => {
  test('the audio kind restricts the picker to mp3 and m4a mime types', () => {
    expect(getFileKindConfig('audio').mimeTypes).toEqual(['audio/mpeg', 'audio/x-m4a', 'audio/mp4'])
  })

  test('the audio library pattern matches mp3 and m4a URLs, including query strings', () => {
    const { libraryPattern } = getFileKindConfig('audio')

    expect(libraryPattern.test('https://cdn.example.com/sermon.mp3')).toBe(true)
    expect(libraryPattern.test('https://cdn.example.com/sermon.m4a')).toBe(true)
    expect(libraryPattern.test('https://cdn.example.com/sermon.m4a?token=abc')).toBe(true)
    expect(libraryPattern.test('https://cdn.example.com/sermon.wav')).toBe(false)
  })

  test('only the image kind supports the server media library', () => {
    expect(getFileKindConfig('image').supportsLibrary).toBe(true)
    expect(getFileKindConfig('audio').supportsLibrary).toBe(false)
    expect(getFileKindConfig('text').supportsLibrary).toBe(false)
  })
})

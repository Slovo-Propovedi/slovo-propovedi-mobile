import { getFileKindConfig, isAllowedExtension } from './fileKinds'

describe('isAllowedExtension', () => {
  test('rejects a non-mp3 file for the audio kind', () => {
    expect(isAllowedExtension('audio', 'sermon.wav')).toBe(false)
    expect(isAllowedExtension('audio', 'sermon.mp3')).toBe(true)
    expect(isAllowedExtension('audio', 'SERMON.MP3')).toBe(true)
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
  test('the audio kind restricts the picker to mpeg', () => {
    expect(getFileKindConfig('audio').mimeTypes).toEqual(['audio/mpeg'])
  })
})

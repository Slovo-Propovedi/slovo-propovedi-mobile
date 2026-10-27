import { getThumbnailUri } from './getThumbnailUri'

const UUID = '7e050797-10c8-4849-9dfb-103eac0472eb'

describe('getThumbnailUri', () => {
  test.each(['jpg', 'JPEG', 'png', 'webp'])('maps a stored .%s cover to its preview', ext => {
    expect(getThumbnailUri(`https://minio.example.com/files/${UUID}.${ext}`)).toBe(
      `https://minio.example.com/files/thumbs/${UUID}.webp`,
    )
  })

  test.each([
    null,
    undefined,
    '',
    'https://example.com/image.jpg',
    `https://minio.example.com/files/${UUID}.mp3`,
    `https://minio.example.com/files/thumbs/${UUID}.webp`,
  ])('returns null for %p', uri => {
    expect(getThumbnailUri(uri)).toBeNull()
  })
})

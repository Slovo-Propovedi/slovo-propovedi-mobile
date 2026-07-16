import { youtubeApi } from '../../api/youtube'
import { getYoutubeVideoData } from './getYoutubeVideoData'

const VIDEO_ID = 'dQw4w9WgXcQ'

const mockSuccessResponse = (items: unknown[]) => ({
  data: { items },
})

const mockItem = { id: VIDEO_ID, snippet: {} }

describe('getYoutubeVideoData', () => {
  beforeEach(() => {
    jest.spyOn(youtubeApi, 'get')
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(youtubeApi.get as jest.Mock).mockResolvedValue(mockSuccessResponse([mockItem]))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('extractVideoId (indirect via spy params)', () => {
    test('extracts ID from youtu.be short URL', async () => {
      await getYoutubeVideoData(`https://youtu.be/${VIDEO_ID}`)

      expect(youtubeApi.get).toHaveBeenCalledWith('videos', {
        params: { id: VIDEO_ID },
      })
    })

    test('extracts ID from youtube.com/watch URL', async () => {
      await getYoutubeVideoData(`https://www.youtube.com/watch?v=${VIDEO_ID}`)

      expect(youtubeApi.get).toHaveBeenCalledWith('videos', {
        params: { id: VIDEO_ID },
      })
    })

    test('extracts ID from youtube.com/embed URL', async () => {
      await getYoutubeVideoData(`https://www.youtube.com/embed/${VIDEO_ID}`)

      expect(youtubeApi.get).toHaveBeenCalledWith('videos', {
        params: { id: VIDEO_ID },
      })
    })

    test('extracts ID from youtube.com/v URL', async () => {
      await getYoutubeVideoData(`https://www.youtube.com/v/${VIDEO_ID}`)

      expect(youtubeApi.get).toHaveBeenCalledWith('videos', {
        params: { id: VIDEO_ID },
      })
    })

    test('extracts ID from URL with extra params', async () => {
      await getYoutubeVideoData(`https://www.youtube.com/watch?v=${VIDEO_ID}&t=42s`)

      expect(youtubeApi.get).toHaveBeenCalledWith('videos', {
        params: { id: VIDEO_ID },
      })
    })

    test('passes empty string ID for non-YouTube URL', async () => {
      await getYoutubeVideoData('https://example.com/video/123')

      expect(youtubeApi.get).toHaveBeenCalledWith('videos', {
        params: { id: '' },
      })
    })
  })

  describe('response parsing', () => {
    test('returns first item when response has items array', async () => {
      const result = await getYoutubeVideoData(`https://youtu.be/${VIDEO_ID}`)

      expect(result).toEqual(mockItem)
    })

    test('returns undefined when response has empty items array', async () => {
      ;(youtubeApi.get as jest.Mock).mockResolvedValue(mockSuccessResponse([]))

      const result = await getYoutubeVideoData(`https://youtu.be/${VIDEO_ID}`)

      expect(result).toBeUndefined()
    })

    test('returns null when response.data is not an object', async () => {
      ;(youtubeApi.get as jest.Mock).mockResolvedValue({ data: 'string' })

      const result = await getYoutubeVideoData(`https://youtu.be/${VIDEO_ID}`)

      expect(result).toBeNull()
    })

    test('returns null when response has no items property', async () => {
      ;(youtubeApi.get as jest.Mock).mockResolvedValue({
        data: { etag: 'abc' },
      })

      const result = await getYoutubeVideoData(`https://youtu.be/${VIDEO_ID}`)

      expect(result).toBeNull()
    })
  })

  describe('error handling', () => {
    test('returns null and logs error when API call throws', async () => {
      ;(youtubeApi.get as jest.Mock).mockRejectedValue(new Error('Network error'))

      const result = await getYoutubeVideoData(`https://youtu.be/${VIDEO_ID}`)

      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalledWith(
        'Ошибка при получении данных о видео:',
        expect.any(Error),
      )
    })
  })
})

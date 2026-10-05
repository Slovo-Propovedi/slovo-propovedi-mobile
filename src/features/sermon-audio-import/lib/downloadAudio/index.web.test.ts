import { downloadAudio } from './index.web'

const mockUploadAudioBlob = jest.fn()

jest.mock('shared/api', () => ({
  uploadAudioBlob: (...args: unknown[]) => mockUploadAudioBlob(...args),
}))

const AUDIO_URL = 'https://inv.test/videoplayback?audio'
const FILE_NAME = 'Проповедь о покаянии.m4a'
const MIME_TYPE = 'audio/mp4'
const FILE_URL = 'https://cdn.test/sermon.m4a'

const INPUT = { audioUrl: AUDIO_URL, fileName: FILE_NAME, mimeType: MIME_TYPE }

const CHUNKS = [new Uint8Array(256).fill(1), new Uint8Array(256).fill(2)]
const TOTAL_BYTES = 512

const responseWithBody = (chunks: Uint8Array[], contentLength?: number): Response => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach(chunk => controller.enqueue(chunk))
      controller.close()
    },
  })

  const headers = new Headers()
  if (contentLength !== undefined) headers.set('Content-Length', String(contentLength))

  return new Response(stream, { headers, status: 200 })
}

const mockFetchResponse = (response: Response) =>
  jest.spyOn(globalThis, 'fetch').mockResolvedValue(response)

const collectProgress = () => {
  const percents: number[] = []

  return { onProgress: (percent: number) => percents.push(percent), percents }
}

describe('downloadAudio (web)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUploadAudioBlob.mockResolvedValue({ fileName: FILE_NAME, fileUrl: FILE_URL })
  })

  test('streams into a Blob, reports progress and uploads it with its file name', async () => {
    mockFetchResponse(responseWithBody(CHUNKS, TOTAL_BYTES))
    const { onProgress, percents } = collectProgress()

    const downloaded = await downloadAudio(INPUT, onProgress, undefined)
    await expect(downloaded.upload(() => undefined)).resolves.toBe(FILE_URL)

    expect(percents).toEqual([0, 50, 100])
    const [blob, fileName, options] = mockUploadAudioBlob.mock.calls[0]
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe(MIME_TYPE)
    expect(blob.size).toBe(TOTAL_BYTES)
    expect(fileName).toBe(FILE_NAME)
    expect(options).toEqual({ onProgress: expect.any(Function) })
    expect(downloaded.dispose()).toBeUndefined()
  })

  test('keeps the intermediate progress indeterminate without Content-Length', async () => {
    mockFetchResponse(responseWithBody(CHUNKS))
    const { onProgress, percents } = collectProgress()

    await downloadAudio(INPUT, onProgress, undefined)

    expect(percents).toEqual([0, 100])
  })

  test('rejects when the server responds with an error status', async () => {
    mockFetchResponse(new Response(null, { status: 404 }))

    await expect(downloadAudio(INPUT, () => undefined, undefined)).rejects.toThrow()
    expect(mockUploadAudioBlob).not.toHaveBeenCalled()
  })

  test('forwards the abort signal to fetch', async () => {
    const fetchSpy = mockFetchResponse(responseWithBody(CHUNKS, TOTAL_BYTES))
    const controller = new AbortController()

    await downloadAudio(INPUT, () => undefined, controller.signal)

    expect(fetchSpy).toHaveBeenCalledWith(AUDIO_URL, { signal: controller.signal })
  })
})

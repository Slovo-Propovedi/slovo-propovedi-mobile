import { type Innertube } from 'youtubei.js'
import { type ResolvedAudio } from './importTypes'
import { ImportSourceError } from './sourceErrors'
import { assertVideoIsDownloadable, pickAudioFormat, readYoutubeHttpStatus } from './youtubeFormat'

// ANDROID_VR — единственный клиент, который в 2026-м отдаёт потоки без PO-токена
// и без шифрования ссылок: ни подпись, ни параметр `n` расшифровывать не нужно,
// поэтому плеерный JS YouTube не загружается и не исполняется. Клиенты с
// шифрованными ссылками (WEB_EMBEDDED и др.) требуют исполнять код с youtube.com
// внутри приложения — от них отказались намеренно (см. docs/features/admin.md).
const INNERTUBE_CLIENT = 'ANDROID_VR'

// В детали ошибки важен и клиент, и статус («ANDROID_VR: 403»): без них
// непонятно, упёрлись ли в блокировку YouTube или в сеть.
const describeClientFailure = (error: unknown): string => {
  const status = readYoutubeHttpStatus(error)
  const reason =
    status !== undefined ? String(status) : error instanceof Error ? error.message : String(error)

  return `${INNERTUBE_CLIENT}: ${reason}`
}

const fetchVideoInfo = async (innertube: Innertube, videoId: string) => {
  try {
    return await innertube.getBasicInfo(videoId, { client: INNERTUBE_CLIENT })
  } catch (error) {
    throw new ImportSourceError('service-unavailable', new Error(describeClientFailure(error)))
  }
}

/**
 * Достаёт метаданные и прямую ссылку на аудиодорожку через клиент ANDROID_VR.
 * Ссылка берётся как есть (`decipher()` без плеера): если YouTube прислал
 * шифрованный формат, импорт падает с «Сервис недоступен», а не исполняет JS
 * плеера. Ошибки самого видео (эфир, нет аудио, требуется вход) пробрасываются
 * своими кодами.
 * @param innertube - Готовая сессия InnerTube (создана без плеера).
 * @param videoId - ID видео YouTube.
 */
export const resolveYoutubeAudioFromInnertube = async (
  innertube: Innertube,
  videoId: string,
): Promise<ResolvedAudio> => {
  const info = await fetchVideoInfo(innertube, videoId)

  assertVideoIsDownloadable({
    isLive: Boolean(info.basic_info.is_live),
    status: info.playability_status?.status as
      ('ERROR' | 'LOGIN_REQUIRED' | 'OK' | 'UNPLAYABLE') | undefined,
  })

  const format = pickAudioFormat(info.streaming_data?.adaptive_formats ?? [])
  if (!format) throw new ImportSourceError('no-audio')

  const audioUrl = await format.decipher()
  if (!audioUrl)
    throw new ImportSourceError(
      'service-unavailable',
      new Error(`${INNERTUBE_CLIENT}: ciphered stream URL`),
    )

  return {
    audioUrl,
    description: info.basic_info.short_description ?? null,
    title: info.basic_info.title ?? '',
    videoId,
  }
}

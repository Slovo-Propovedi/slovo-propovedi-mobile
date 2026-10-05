import { type Innertube } from 'youtubei.js'
import { type ResolvedAudio } from './importTypes'
import { ImportSourceError } from './sourceErrors'
import {
  assertVideoIsDownloadable,
  isYoutubeForbiddenError,
  pickAudioFormat,
  readYoutubeHttpStatus,
} from './youtubeFormat'

// ANDROID_VR — единственный клиент, который в 2026-м отдаёт потоки без
// PO-токена; WEB_EMBEDDED — запасной (PO-токен не нужен, но работает только для
// видео, разрешённых к встраиванию). WEB/ANDROID/IOS требуют подписи и упираются
// в LOGIN_REQUIRED.
const CLIENT_FALLBACK_CHAIN = ['ANDROID_VR', 'WEB_EMBEDDED'] as const
type InnertubeClient = (typeof CLIENT_FALLBACK_CHAIN)[number]

const resolveWithClient = async (
  innertube: Innertube,
  videoId: string,
  client: InnertubeClient,
): Promise<ResolvedAudio> => {
  const info = await innertube.getBasicInfo(videoId, { client })

  assertVideoIsDownloadable({
    isLive: Boolean(info.basic_info.is_live),
    status: info.playability_status?.status as
      ('ERROR' | 'LOGIN_REQUIRED' | 'OK' | 'UNPLAYABLE') | undefined,
  })

  const format = pickAudioFormat(info.streaming_data?.adaptive_formats ?? [])
  if (!format) throw new ImportSourceError('no-audio')

  return {
    audioUrl: await format.decipher(innertube.session.player),
    description: info.basic_info.short_description ?? null,
    title: info.basic_info.title ?? '',
    videoId,
  }
}

// В детали ошибки важен и клиент, и статус («ANDROID_VR: 403»): без них
// непонятно, упёрлись ли в блокировку YouTube или в сеть.
const describeClientFailure = (error: unknown): string => {
  const status = readYoutubeHttpStatus(error)
  if (status !== undefined) return String(status)

  return error instanceof Error ? error.message : String(error)
}

/**
 * Прогоняет клиентов InnerTube по цепочке фолбэка: при 403 пробует следующий
 * (WEB_EMBEDDED), иначе сразу отдаёт сбой. Ошибки самого видео (эфир, нет аудио,
 * требуется вход) не зависят от клиента и пробрасываются без повторов.
 * @param innertube - Готовая сессия InnerTube.
 * @param videoId - ID видео YouTube.
 */
export const resolveYoutubeAudioWithFallback = async (
  innertube: Innertube,
  videoId: string,
): Promise<ResolvedAudio> => {
  const failures: string[] = []

  for (const client of CLIENT_FALLBACK_CHAIN)
    try {
      return await resolveWithClient(innertube, videoId, client)
    } catch (error) {
      // Ошибки самого видео (эфир, нет аудио, требуется вход) не зависят от
      // клиента — смена клиента их не исправит.
      if (error instanceof ImportSourceError) throw error

      failures.push(`${client}: ${describeClientFailure(error)}`)
      // Фолбэк оправдан только при 403 (клиент заблокирован): сетевые сбои и
      // ошибки расшифровки сменой клиента не лечатся.
      if (!isYoutubeForbiddenError(error)) break
    }

  throw new ImportSourceError('service-unavailable', new Error(failures.join('; ')))
}

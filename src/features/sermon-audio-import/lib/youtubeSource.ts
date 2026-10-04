/* eslint-disable camelcase -- Innertube.create options are snake_case in youtubei.js */
import { type Innertube, type YT } from 'youtubei.js'
import { type ResolvedAudio } from './importTypes'
import { ImportSourceError } from './sourceErrors'
import { installYoutubeShims } from './youtubeShims'

// itag 140 — аудио в AAC/mp4: играется нативно и в вебе, в отличие от opus/webm.
const PREFERRED_ITAG = 140
const PREFERRED_MIME_TYPE = 'mp4'

// ANDROID_VR — единственный клиент, который в 2026-м отдаёт потоки без
// PO-токена; WEB/ANDROID/IOS требуют подписи и упираются в LOGIN_REQUIRED.
const INNERTUBE_CLIENT = 'ANDROID_VR'

// Сессия Innertube тяжёлая (сеть + расшифровка плеера), поэтому одна на процесс.
let innertubePromise: null | Promise<Innertube> = null

/**
 * Клиент InnerTube грузится лениво: библиотека весит мегабайты и нужна только
 * админу в момент импорта, поэтому обычные пользователи её не грузят вовсе.
 */
const createInnertube = async (): Promise<Innertube> => {
  const { Innertube, Log } = await import('youtubei.js')
  if (!__DEV__) Log.setLevel(Log.Level.NONE)

  // Шимы обязаны идти после загрузки библиотеки: её RN-платформа перезаписывает
  // `eval` при инициализации.
  await installYoutubeShims()

  return Innertube.create({
    enable_session_cache: false,
    lang: 'en',
    retrieve_player: true,
  })
}

const getInnertube = async (): Promise<Innertube> => {
  innertubePromise ??= createInnertube()

  try {
    return await innertubePromise
  } catch (error) {
    // Неудачное создание не кешируем: следующий импорт попробует снова.
    innertubePromise = null
    throw error
  }
}

const pickAudioFormat = (info: YT.VideoInfo) => {
  const audioFormats = (info.streaming_data?.adaptive_formats ?? []).filter(
    format =>
      format.mime_type.startsWith('audio/') && format.mime_type.includes(PREFERRED_MIME_TYPE),
  )

  return (
    audioFormats.find(format => format.itag === PREFERRED_ITAG) ??
    [...audioFormats].sort((first, second) => second.bitrate - first.bitrate)[0]
  )
}

const assertVideoIsDownloadable = (info: YT.VideoInfo): void => {
  const status = info.playability_status?.status
  if (status === 'LOGIN_REQUIRED') throw new ImportSourceError('login-required')
  if (status !== undefined && status !== 'OK') throw new ImportSourceError('video-unavailable')
  if (info.basic_info.is_live) throw new ImportSourceError('live')
}

const resolveFromYoutube = async (videoId: string): Promise<ResolvedAudio> => {
  const innertube = await getInnertube()
  const info = await innertube.getBasicInfo(videoId, { client: INNERTUBE_CLIENT })

  assertVideoIsDownloadable(info)

  const format = pickAudioFormat(info)
  if (!format) throw new ImportSourceError('no-audio')

  return {
    audioUrl: await format.decipher(innertube.session.player),
    description: info.basic_info.short_description ?? null,
    durationSec: info.basic_info.duration ?? null,
    title: info.basic_info.title ?? '',
    videoId,
  }
}

/**
 * Достаёт метаданные и расшифрованную ссылку на аудиодорожку напрямую из
 * InnerTube. Ловит и оборачивает в `ImportSourceError` любые сбои клиента
 * (сеть, сессия, расшифровка) — наружу уходят только коды из `ImportErrorCode`.
 * @param videoId - ID видео YouTube.
 */
export const resolveYoutubeAudio = async (videoId: string): Promise<ResolvedAudio> => {
  try {
    return await resolveFromYoutube(videoId)
  } catch (error) {
    if (error instanceof ImportSourceError) throw error

    throw new ImportSourceError('service-unavailable')
  }
}

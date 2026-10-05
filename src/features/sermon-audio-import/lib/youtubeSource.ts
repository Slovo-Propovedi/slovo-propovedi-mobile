/* eslint-disable camelcase -- Innertube.create options are snake_case in youtubei.js */
import { type Innertube } from 'youtubei.js'
import { type ResolvedAudio } from './importTypes'
import { ImportSourceError } from './sourceErrors'
import { assertVideoIsDownloadable, pickAudioFormat } from './youtubeFormat'
import { installYoutubeShims } from './youtubeShims'

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

const resolveFromYoutube = async (videoId: string): Promise<ResolvedAudio> => {
  const innertube = await getInnertube()
  const info = await innertube.getBasicInfo(videoId, { client: INNERTUBE_CLIENT })

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

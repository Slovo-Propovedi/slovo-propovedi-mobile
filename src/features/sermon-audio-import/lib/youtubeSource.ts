/* eslint-disable camelcase -- Innertube.create options are snake_case in youtubei.js */
import { type Innertube } from 'youtubei.js'
import { type ResolvedAudio } from './importTypes'
import { ImportSourceError } from './sourceErrors'
import { resolveYoutubeAudioWithFallback } from './youtubeClients'
import { installYoutubeShims } from './youtubeShims'

// UA скопирован из youtubei.js Constants.CLIENTS.ANDROID_VR (v18.1.0): клиент
// обязан представляться тем же приложением, что и в client-контексте, иначе
// YouTube отвечает 403.
const ANDROID_VR_USER_AGENT =
  'com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip'

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
    user_agent: ANDROID_VR_USER_AGENT,
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

  return resolveYoutubeAudioWithFallback(innertube, videoId)
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

    throw new ImportSourceError('service-unavailable', error)
  }
}

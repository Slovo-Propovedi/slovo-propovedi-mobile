// Идентификатор видео вытаскивается из любой ссылки, которую пользователь
// вставил в поле «YouTube (URL)»: обычный ролик, Shorts, эмбед, прямая ссылка
// youtu.be или «голый» ID. Всё, что не распознано, — ошибка ввода (null).

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/

const YOUTUBE_HOSTS = new Set([
  'm.youtube.com',
  'music.youtube.com',
  'www.youtu.be',
  'www.youtube.com',
  'youtu.be',
  'youtube.com',
])

// Префиксы пути, за которым лежит ID: /shorts/ID, /embed/ID, /live/ID, /v/ID.
const PATH_PREFIXES = ['embed', 'live', 'shorts', 'v']

const isVideoId = (value: string): boolean => VIDEO_ID_PATTERN.test(value)

const readVideoId = (url: URL): null | string => {
  const queryId = url.searchParams.get('v')
  if (queryId) return isVideoId(queryId) ? queryId : null

  const [first, second] = url.pathname.split('/').filter(Boolean)
  if (first === undefined) return null
  if (second !== undefined && PATH_PREFIXES.includes(first))
    return isVideoId(second) ? second : null

  return isVideoId(first) ? first : null
}

/**
 * Достаёт ID видео YouTube из ссылки или из «голого» ID.
 * @param input - Строка из поля «YouTube (URL)».
 * @returns ID видео либо `null`, если ссылка чужая или ID невалиден.
 */
export const parseVideoId = (input: string): null | string => {
  const value = input.trim()
  if (isVideoId(value)) return value

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }

  if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null

  return readVideoId(url)
}

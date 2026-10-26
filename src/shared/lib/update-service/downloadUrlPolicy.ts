// Обновления качаются только из релизов нашего репозитория на трёх зеркалах.
// Проверка — по строковому префиксу, а не через `new URL(...).hostname`: URL-полифил
// React Native разбирает адрес регуляркой, и для `https://evil.example/@github.com/…`
// возвращает hostname `github.com`. Префикс со слешем после хоста однозначно
// фиксирует хост (userinfo/порт в него не вклиниваются) и путь до репозитория.
export const ALLOWED_UPDATE_URL_PREFIXES = [
  'https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/releases/download/',
  'https://codeberg.org/Slovo_Propovedi/slovo-propovedi-mobile/releases/download/',
  'https://github.com/Slovo-Propovedi/slovo-propovedi-mobile/releases/download/',
] as const

// Сегменты `..` (в т.ч. percent-encoded) и обратный слеш могли бы увести путь
// за пределы релизов репозитория после нормализации на стороне загрузчика.
const PATH_ESCAPE_PATTERN = /(^|[/\\])(\.|%2e){2}([/\\]|$)|\\/i

export const assertAllowedUpdateUrl = (url: string): void => {
  if (!url.startsWith('https://'))
    throw new Error(`[updateService] Update download URL must use https, got: ${url}`)

  const matchedPrefix = ALLOWED_UPDATE_URL_PREFIXES.find(prefix => url.startsWith(prefix))
  if (!matchedPrefix) throw new Error(`[updateService] Update download URL is not allowed: ${url}`)

  if (PATH_ESCAPE_PATTERN.test(url.slice(matchedPrefix.length)))
    throw new Error(`[updateService] Unsafe path in update download URL: ${url}`)
}

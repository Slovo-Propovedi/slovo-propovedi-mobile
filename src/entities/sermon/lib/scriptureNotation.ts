// Обозначение ссылок на Писание: разбор строки стихов и диапазона глав.
// Порт из Svelte-админки (`slovo-propovedi-admin`, `src/lib/utils/labels.ts`) —
// общий язык для формы проповеди и, в будущем, для отображения. Сериализация
// обратного направления живёт в `scriptureSerialization.ts`.
//
// На проводе (API-тип): массив ровно из двух целых чисел трактуется как
// диапазон «от–до»; массив кортежей или смесь целых и кортежей — список
// разрозненных отрезков.

/** Стихи: одиночный, диапазон или список разрозненных отрезков. */
export type Verse = [number, number] | number | VerseSegment[]

/** Глава: одиночная или диапазон [от, до]. */
type Chapter = [number, number] | number

/** Один отрезок стихов: одиночный стих или диапазон [от, до]. */
type VerseSegment = [number, number] | number

/**
 * Является ли значение диапазоном стихов: массив ровно из двух целых чисел.
 * На проводе такая форма всегда читается как диапазон — форма проповеди
 * обязана применять ту же трактовку к недоверенному вводу.
 * @param verse - Проверяемое значение (обычно из недоверенного ввода).
 */
export const isVerseRangeTuple = (verse: unknown): verse is [number, number] =>
  Array.isArray(verse) &&
  verse.length === 2 &&
  typeof verse[0] === 'number' &&
  typeof verse[1] === 'number'

// Приводит значение поля-числа к строке без падения на не-строке: поля формы —
// `<input type="number">`, поэтому они приходят числами (или null после очистки).
const fieldText = (value: unknown): string => {
  if (value === null || value === undefined) return ''

  return String(value)
}

// Разбирает пару «от/до» в проводной тип. Оба поля опциональны:
// - только «от»   → одиночное число (3)
// - «от» + «до»    → диапазон [3, 4]
// - ни одного      → undefined (нет значения)
// - только «до»    → undefined: конец без начала — ошибка пользователя,
//                    игнорируем, а не выдумываем начало.
// Диапазон сворачивается к одиночному числу, если конец пуст или равен началу.
const parseRange = (start: unknown, end: unknown): [number, number] | number | undefined => {
  const startText = fieldText(start)
  if (startText === '') return undefined

  const startNumber = Number(startText)
  if (Number.isNaN(startNumber)) return undefined

  const endText = fieldText(end)
  if (endText === '') return startNumber

  const endNumber = Number(endText)
  if (Number.isNaN(endNumber) || endNumber === startNumber) return startNumber

  return [startNumber, endNumber]
}

/**
 * Разбирает пару полей главы в проводной тип (одиночная глава или диапазон).
 * @param start - Начало диапазона (поле «от»).
 * @param end - Конец диапазона (поле «до»).
 */
export const parseChapter = (start: unknown, end: unknown): Chapter | undefined =>
  parseRange(start, end)

// Разбирает одну часть строки «Стихи» через запятую: одиночный стих «16» или
// диапазон «16–18» (дефис может быть '-', '–' или '—'). Схлопнутый диапазон
// (a == b) — одиночный стих. Для всего остального — undefined.
const parseVerseSegment = (part: string): undefined | VerseSegment => {
  const match = /^(\d+)(?:\s*[-–—]\s*(\d+))?$/.exec(part)
  if (match === null) return undefined

  const start = Number(match[1])
  const end = match[2] === undefined ? undefined : Number(match[2])
  // Стихи 1-based и должны переживать String(): отклоняем 0, отрицательные и
  // всё, что больше Number.MAX_SAFE_INTEGER (2^53 − 1) — String() отрендерил бы
  // их как "1e+22" и обратно уже не разобрал.
  if (!Number.isSafeInteger(start) || start < 1) return undefined
  if (end !== undefined && (!Number.isSafeInteger(end) || end < 1)) return undefined
  if (end === undefined || end === start) return start

  return [start, end]
}

/**
 * Разбирает свободный ввод «Стихи» в проводной тип: список одиночных стихов и
 * диапазонов через запятую («16», «16–18», «9–18, 20»). Одна часть даёт число
 * или кортеж-диапазон; несколько — массив отрезков. Любая невалидная часть
 * (или пустой ввод) даёт undefined — форма отправляет null, очищая поле.
 * @param text - Свободный ввод поля «Стихи».
 */
export const parseVerseInput = (text: string): undefined | Verse => {
  const parts = text
    .split(',')
    .map(part => part.trim())
    .filter(part => part !== '')
  if (parts.length === 0) return undefined

  const segments: VerseSegment[] = []
  for (const part of parts) {
    const segment = parseVerseSegment(part)
    if (segment === undefined) return undefined

    segments.push(segment)
  }

  if (segments.length === 1) return segments[0]
  // Защита от неоднозначности: на проводе массив из двух целых читается как
  // диапазон, поэтому «9, 20» нельзя отправлять как [9, 20] — бэкенд молча
  // прочёл бы это как диапазон 9–20. Оборачивание каждого одиночного стиха в
  // [n, n] сохраняет смысл разрозненных стихов без неоднозначности.
  if (segments.length === 2 && segments.every(segment => typeof segment === 'number'))
    return segments.map(segment => [segment, segment] as [number, number])

  return segments
}

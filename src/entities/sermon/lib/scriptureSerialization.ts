import { isVerseRangeTuple } from './scriptureNotation'

// Значение стихов со стороны API: одиночное число, массив чисел или массив
// отрезков (чисел и кортежей). Шире строгого `Verse` и принимается на границе.
type VerseInput = (number | number[])[] | null | number | number[] | undefined

// Приводит один отрезок стихов к отображаемой форме: схлопнутый [n, n]
// читается как одиночный стих, широкий кортеж — как диапазон.
const formatVerseSegment = (segment: number | number[]): string => {
  if (Array.isArray(segment))
    return segment[0] === segment[1] ? String(segment[0]) : `${segment[0]}–${segment[1]}`

  return String(segment)
}

// Приводит значение стихов (одиночное, диапазон, разрозненные отрезки) к
// читаемой строке: 16, 16–18, 9–18, 20.
const formatVerseValue = (verse: (number | number[])[] | number | number[]): string => {
  if (isVerseRangeTuple(verse)) return formatVerseSegment(verse)
  if (Array.isArray(verse)) return verse.map(formatVerseSegment).join(', ')

  return String(verse)
}

/**
 * Сериализует значение стихов обратно в свободный ввод «Стихи». Зеркалит
 * нормализацию отображения: [n, n] схлопывается к «n», отрезки соединяются
 * через «, ». Отсутствующее значение даёт пустую строку (ввод очищается).
 * @param verse - Значение стихов со стороны API (или null/undefined).
 */
export const serializeVerseInput = (verse: VerseInput): string => {
  if (verse === undefined || verse === null) return ''

  return formatVerseValue(verse)
}

import {
  isVerseRangeTuple,
  parseChapter,
  parseVerseInput,
  serializeVerseInput,
  type Verse,
} from 'entities/sermon'
import { type APITypes } from 'shared/api'
import { type SermonFormValues } from './sermonFormInitialValues'

const isFilled = (value: string) => value.trim() !== ''

const RANGE_VERSE_ERROR = 'Заполните оба поля стихов или оставьте их пустыми.'
const PLAIN_VERSE_ERROR = 'Поле «Стихи» заполнено неверно. Примеры: 16, 16–18, 9–18, 20.'

/**
 * Заполнен ли конец главы: непустой включает режим диапазона стихов.
 * @param values - Текущие значения формы.
 */
export const isRangeMode = (values: SermonFormValues): boolean => isFilled(values.chapterEnd)

const isOneVerseFieldFilled = (values: SermonFormValues): boolean =>
  isFilled(values.verseStart) !== isFilled(values.verseEnd)

/**
 * Живая проверка поля стихов: появляется при вводе, а не только при отправке.
 * В режиме диапазона требуется пара из обоих полей; в обычном — валидный текст.
 * @param values - Текущие значения формы.
 */
export const verseError = (values: SermonFormValues): string => {
  if (isRangeMode(values)) return isOneVerseFieldFilled(values) ? RANGE_VERSE_ERROR : ''

  const text = values.verseText.trim()
  if (text !== '' && parseVerseInput(text) === undefined) return PLAIN_VERSE_ERROR

  return ''
}

/**
 * Разрешает стихи для отправки: null — очистить поле, значение — отправить,
 * undefined — невалидный ввод (форма не отправляется, inline-ошибка уже видна).
 * @param values - Текущие значения формы.
 */
export const resolveVerse = (values: SermonFormValues): null | undefined | Verse => {
  if (isRangeMode(values)) {
    const startFilled = isFilled(values.verseStart)
    const endFilled = isFilled(values.verseEnd)
    if (!startFilled && !endFilled) return null
    if (!startFilled || !endFilled) return undefined

    return [Number(values.verseStart), Number(values.verseEnd)]
  }

  const text = values.verseText.trim()
  if (text === '') return null

  return parseVerseInput(text)
}

// Вход в режим диапазона: свободный текст становится парой полей. Кортеж
// заполняет оба, одиночный стих — только начало, остальное оставляет пустым.
const enterRangeMode = (
  values: SermonFormValues,
): Pick<SermonFormValues, 'verseEnd' | 'verseStart'> => {
  const parsed = parseVerseInput(values.verseText)
  if (isVerseRangeTuple(parsed))
    return { verseEnd: String(parsed[1]), verseStart: String(parsed[0]) }
  if (typeof parsed === 'number') return { verseEnd: '', verseStart: String(parsed) }

  return { verseEnd: '', verseStart: '' }
}

// Выход из режима диапазона: заполненная пара становится текстом диапазона.
// Неполная пара сюда не доходит (её отклоняет обработчик смены конца главы).
const leaveRangeMode = (values: SermonFormValues): string => {
  if (!isFilled(values.verseStart) || !isFilled(values.verseEnd)) return values.verseText

  return serializeVerseInput([Number(values.verseStart), Number(values.verseEnd)])
}

/**
 * Обрабатывает смену поля «Глава (по)» — переключателя режима стихов.
 * Возвращает следующие значения формы: непустой конец входит в режим диапазона,
 * очистка выходит из него (если пара стихов не заполнена наполовину — иначе
 * очистка блокируется, чтобы не потерять выбор пользователя).
 * @param values - Текущие значения формы.
 * @param nextEnd - Новое значение поля «Глава (по)».
 */
export const applyChapterEndChange = (
  values: SermonFormValues,
  nextEnd: string,
): SermonFormValues => {
  const wasRangeMode = isFilled(values.chapterEnd)
  const nowRangeMode = isFilled(nextEnd)

  if (wasRangeMode && !nowRangeMode && isOneVerseFieldFilled(values))
    return { ...values, chapterEnd: values.chapterEnd }

  const next: SermonFormValues = { ...values, chapterEnd: nextEnd }
  if (!wasRangeMode && nowRangeMode) return { ...next, ...enterRangeMode(values) }
  if (wasRangeMode && !nowRangeMode) return { ...next, verseText: leaveRangeMode(values) }

  return next
}

// Общие поля тела запроса: очищенные nullable-поля уходят как null (бэкенд
// очищает колонку; undefined читался бы как «без изменений»); playlistsIds
// всегда массив (пустой очищает связь).
const buildCommonFields = (values: SermonFormValues) => ({
  artist: values.artist.trim(),
  artwork: values.artwork.trim(),
  audioUrl: values.audioUrl.trim() || null,
  book: values.book.trim() || null,
  chapter: parseChapter(values.chapterStart, values.chapterEnd) ?? null,
  description: values.description.trim() || null,
  playlistsIds: values.selectedPlaylistIds,
  textFileUrl: values.textFileUrl.trim() || null,
  title: values.title.trim(),
  verse: resolveVerse(values) ?? null,
  youtubeUrl: values.youtubeUrl.trim() || null,
})

export const buildCreateSermonDto = (values: SermonFormValues): APITypes.CreateSermonDto =>
  buildCommonFields(values)

export const buildUpdateSermonDto = (values: SermonFormValues): APITypes.UpdateSermonDto =>
  buildCommonFields(values)

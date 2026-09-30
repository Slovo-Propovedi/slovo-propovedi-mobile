import { type SermonData } from '../model/sermon'
import { formatSermonReference } from './formatSermonReference'

/**
 * Подпись под названием проповеди: проповедник плюс ссылка на Писание, когда
 * она есть. Отсутствующая ссылка вырождается в одного проповедника,
 * отсутствующий проповедник — в одну ссылку, а их отсутствие — в пустую строку
 * (никакого висящего разделителя и никакого «null»). Принимает любой объект с
 * этими опциональными полями, поэтому подходит и `SermonEntity`, и
 * `PlaylistSermon`.
 * @param sermon - Проповедь с необязательными полями подписи.
 * @param sermon.artist - Проповедник.
 * @param sermon.book - Книга Писания.
 * @param sermon.chapter - Глава (число или диапазон).
 * @param sermon.verse - Стихи (число, диапазон или отрезки).
 */
export const sermonSubtitle = (sermon: {
  artist?: null | string
  book?: SermonData['book']
  chapter?: SermonData['chapter']
  verse?: SermonData['verse']
}): string => {
  const reference = formatSermonReference(sermon)
  if (reference && sermon.artist) return `${sermon.artist} · ${reference}`

  return reference || (sermon.artist ?? '')
}

import { isVerseRangeTuple, serializeVerseInput } from 'entities/sermon'
import { type APITypes } from 'shared/api'

export interface SermonFormValues {
  artist: string
  artwork: string
  audioUrl: string
  book: string
  chapterEnd: string
  chapterStart: string
  description: string
  selectedPlaylistIds: string[]
  textFileUrl: string
  title: string
  verseEnd: string
  verseStart: string
  verseText: string
  youtubeUrl: string
}

// Начальные значения формы: порт `createFormSnapshot` Svelte-админки.
export const initialFormValues = (initial?: APITypes.SermonEntity | null): SermonFormValues => {
  const chapter = initial?.chapter
  const chapterIsRange = chapter !== null && chapter !== undefined && Array.isArray(chapter)
  const verse = initial?.verse
  const verseIsRange = isVerseRangeTuple(verse)

  return {
    artist: initial?.artist ?? '',
    artwork: initial?.artwork ?? '',
    audioUrl: initial?.audioUrl ?? '',
    book: initial?.book ?? '',
    chapterEnd: chapterIsRange ? String(chapter[1]) : '',
    chapterStart:
      chapter === null || chapter === undefined
        ? ''
        : String(Array.isArray(chapter) ? chapter[0] : chapter),
    description: initial?.description ?? '',
    selectedPlaylistIds: initial?.playlists.map(playlist => playlist.id) ?? [],
    textFileUrl: initial?.textFileUrl ?? '',
    title: initial?.title ?? '',
    verseEnd: chapterIsRange && verseIsRange ? String(verse[1]) : '',
    verseStart: chapterIsRange && verseIsRange ? String(verse[0]) : '',
    // В режиме диапазона главы пара стихов предзаполняется из кортежа, а
    // сериализованный текст пуст (одиночные стихи и отрезки несовместимы с
    // диапазоном глав на сервере). В обычном режиме поле держит стихи, '' для null.
    verseText: chapterIsRange ? '' : serializeVerseInput(verse),
    youtubeUrl: initial?.youtubeUrl ?? '',
  }
}

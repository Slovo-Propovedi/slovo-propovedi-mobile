import { formatSermonReference } from 'shared/lib/format'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'

const APP_NAME = 'Слово.Проповеди'

export const getPlayerSubtitle = (audio: AudioPlayerData, playlist: null | PlaylistData): string =>
  formatSermonReference({ book: audio.book, chapter: audio.chapter, verse: audio.verse }) ??
  (playlist?.sermons.length === 1 ? playlist.sections?.[0]?.title : undefined) ??
  playlist?.title ??
  APP_NAME

// Аудио уходит на сервер как есть (m4a/AAC, itag 140) без перекодирования:
// конвертация потребовала бы нативного ffmpeg, а m4a играется и нативно, и в вебе.
const AUDIO_EXTENSION = '.m4a'

// Имя файла на диске и на сервере строим из заголовка видео, поэтому в нём не
// должно быть разделителей пути и управляющих символов (MinIO их не примет),
// а длина ограничена лимитом хранилища.
const FALLBACK_FILE_STEM = 'youtube-audio'
const MAX_FILE_STEM_LENGTH = 80
const FORBIDDEN_FILE_CHARS = /[\\/:*?"<>|]/g

/**
 * Строит имя m4a-файла из заголовка видео: заменяет разделители пути и
 * управляющие символы, ограничивает длину и подставляет запасное имя для пустого
 * заголовка.
 * @param title - Заголовок видео с YouTube/Invidious.
 */
export const buildAudioFileName = (title: string): string => {
  const stem =
    title.replace(FORBIDDEN_FILE_CHARS, '-').trim().slice(0, MAX_FILE_STEM_LENGTH).trim() ||
    FALLBACK_FILE_STEM

  return `${stem}${AUDIO_EXTENSION}`
}

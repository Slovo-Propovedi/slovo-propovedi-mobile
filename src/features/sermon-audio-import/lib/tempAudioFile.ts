import { File, Paths } from 'expo-file-system'

// Аудио уходит на сервер как есть (m4a/AAC, itag 140) без перекодирования:
// конвертация потребовала бы нативного ffmpeg, а m4a играется и нативно, и в вебе.
const AUDIO_EXTENSION = '.m4a'

// Имя файла на диске и на сервере строим из заголовка видео, поэтому в нём не
// должно быть разделителей пути и управляющих символов (MinIO их не примет),
// а длина ограничена лимитом хранилища.
const FALLBACK_FILE_STEM = 'youtube-audio'
const MAX_FILE_STEM_LENGTH = 80
const FORBIDDEN_FILE_CHARS = /[\\/:*?"<>|]/g

const buildFileName = (title: string): string => {
  const stem =
    title.replace(FORBIDDEN_FILE_CHARS, '-').trim().slice(0, MAX_FILE_STEM_LENGTH).trim() ||
    FALLBACK_FILE_STEM

  return `${stem}${AUDIO_EXTENSION}`
}

/**
 * Временный файл аудио в кэше устройства: после загрузки на сервер он удаляется,
 * на диске остаётся лишь копия, нужная плееру.
 * @param title - Заголовок видео, из которого строится имя файла.
 */
export const createTempAudioFile = (title: string): File =>
  new File(Paths.cache, buildFileName(title))

/**
 * Удаляет временный файл, не бросая ошибку: неудачное удаление не должно
 * превращать уже успешный импорт в провал.
 * @param file - Файл кэша, который мог остаться после скачивания.
 */
export const removeTemporaryFile = (file: File): void => {
  try {
    if (file.exists) file.delete()
  } catch {
    // Временный файл не удалился — это не повод проваливать импорт.
  }
}

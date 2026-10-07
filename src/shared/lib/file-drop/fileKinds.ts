// Виды админских файлов и классификация по имени/MIME. Живёт в shared:
// вид нужен и виджетам пикеров, и страницам админки, а предугадыванию до drop
// (`predictDropKinds`) — в первую очередь.

export type AdminFileKind = 'audio' | 'image' | 'text'

const AUDIO_KIND: AdminFileKind = 'audio'
const IMAGE_KIND: AdminFileKind = 'image'
const TEXT_KIND: AdminFileKind = 'text'

const EXTENSION_KIND: Partial<Record<string, AdminFileKind>> = {
  fb2: TEXT_KIND,
  jpeg: IMAGE_KIND,
  jpg: IMAGE_KIND,
  m4a: AUDIO_KIND,
  mp3: AUDIO_KIND,
  pdf: TEXT_KIND,
  png: IMAGE_KIND,
  txt: TEXT_KIND,
  webp: IMAGE_KIND,
}

const TEXT_MIME_TYPES = ['application/pdf', 'text/plain', 'application/xml']

const extensionOf = (fileName: string): string => {
  const dotIndex = fileName.lastIndexOf('.')

  return dotIndex === -1 ? '' : fileName.slice(dotIndex + 1).toLowerCase()
}

/**
 * Определяет вид админского файла по расширению, а при его отсутствии — по
 * MIME-типу. Неизвестные файлы возвращают null и игнорируются наверху.
 * @param fileName - Имя файла.
 * @param mimeType - MIME-тип от браузера (необязательно).
 */
export const detectFileKind = (fileName: string, mimeType?: string): AdminFileKind | null => {
  const kindByExtension = EXTENSION_KIND[extensionOf(fileName)]
  if (kindByExtension) return kindByExtension
  if (mimeType === undefined) return null
  if (mimeType.startsWith('image/')) return IMAGE_KIND
  if (mimeType.startsWith('audio/')) return AUDIO_KIND
  if (TEXT_MIME_TYPES.includes(mimeType)) return TEXT_KIND

  return null
}

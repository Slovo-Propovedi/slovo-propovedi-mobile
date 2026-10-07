// Виды файлов в формах админки: фильтры для каталога библиотеки, системного
// пикера документов и проверки расширения перед загрузкой.

export type AdminFileKind = 'audio' | 'image' | 'text'

interface FileKindConfig {
  /** Расширения, допустимые к загрузке; пусто — загрузка без ограничения. */
  allowedExtensions: string[]
  /** Паттерн расширения в каталоге библиотеки (`GET /files`). */
  libraryPattern: RegExp
  /** MIME-типы для системного пикера документов. */
  mimeTypes: string[]
  /** Сообщение об отказе по расширению. */
  rejectMessage: string
  /** Есть ли у вида серверная библиотека (`GET /files` отдаёт только изображения). */
  supportsLibrary: boolean
}

const MP3_EXTENSION = 'mp3'
const M4A_EXTENSION = 'm4a'

const KIND_CONFIG: Record<AdminFileKind, FileKindConfig> = {
  audio: {
    allowedExtensions: [MP3_EXTENSION, M4A_EXTENSION],
    libraryPattern: /\.(mp3|m4a)(\?.*)?$/i,
    mimeTypes: ['audio/mpeg', 'audio/x-m4a', 'audio/mp4'],
    rejectMessage: 'Допускается только формат MP3 или M4A.',
    supportsLibrary: false,
  },
  image: {
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    libraryPattern: /\.(jpe?g|png|webp)(\?.*)?$/i,
    mimeTypes: ['image/*'],
    rejectMessage: 'Допускаются только изображения (JPEG, PNG, WebP).',
    supportsLibrary: true,
  },
  text: {
    allowedExtensions: [],
    libraryPattern: /\.(pdf|fb2|txt)(\?.*)?$/i,
    mimeTypes: ['application/pdf', 'text/plain', 'application/xml'],
    rejectMessage: '',
    supportsLibrary: false,
  },
}

export const getFileKindConfig = (kind: AdminFileKind): FileKindConfig => KIND_CONFIG[kind]

/**
 * Проверяет расширение файла на соответствие виду. Для видов без ограничений
 * (`text`) возвращает true всегда.
 * @param kind - Вид файла, задающий допустимые расширения.
 * @param fileName - Имя проверяемого файла.
 */
export const isAllowedExtension = (kind: AdminFileKind, fileName: string): boolean => {
  const { allowedExtensions } = KIND_CONFIG[kind]
  if (allowedExtensions.length === 0) return true

  const lowerName = fileName.toLowerCase()

  return allowedExtensions.some(extension => lowerName.endsWith(`.${extension}`))
}

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

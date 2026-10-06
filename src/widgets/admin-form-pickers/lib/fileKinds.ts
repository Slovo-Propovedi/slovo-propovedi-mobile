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

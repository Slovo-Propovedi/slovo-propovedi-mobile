import { type APITypes } from 'shared/api'

export type MediaFileKind = 'audio' | 'image' | 'text'

const KIND_LABELS: Record<MediaFileKind, string> = {
  audio: 'аудио',
  image: 'изображение',
  text: 'текст',
}

const AUDIO_EXTENSIONS = ['.mp3', '.m4a']
const TEXT_EXTENSIONS = ['.pdf', '.fb2']

// Осиротевший скан возвращает только медиа-расширения, поэтому всё, что не
// аудио/текст, — изображение. Тот же allow-list, что и в каталоге, держит
// бейдж типа и разделение «удаляется» честными.
export const getMediaFileKind = (fileName: string): MediaFileKind => {
  const lower = fileName.toLowerCase()
  if (AUDIO_EXTENSIONS.some(extension => lower.endsWith(extension))) return 'audio'
  if (TEXT_EXTENSIONS.some(extension => lower.endsWith(extension))) return 'text'

  return 'image'
}

export const getMediaKindLabel = (kind: MediaFileKind): string => KIND_LABELS[kind]

// Изображения очисткой не удаляются никогда — обложками управляют вручную из
// каталога, поэтому в счётчик удаляемых они не входят.
export const isDeletableOrphan = (file: APITypes.FileMetadataDto): boolean =>
  getMediaFileKind(file.fileName) !== 'image'

// Размер в бинарных единицах; отсутствующий размер — прочерк, а не лживый «0 Б».
export const formatFileSize = (size: null | number): string => {
  if (size === null) return '—'
  if (size < 1024) return `${size} Б`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`

  return `${(size / (1024 * 1024)).toFixed(1)} МБ`
}

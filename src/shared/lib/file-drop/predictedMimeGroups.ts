// Предугадывание видов перетаскиваемых файлов до drop: имена файлов браузер не
// отдаёт до самого drop, поэтому группируем по MIME-типам (`dataTransfer.items`).
// Группы совпадают со строками `AdminFileKind` виджетов админки, но shared не
// зависит от widgets — потребитель тривиально мапит группу в вид.

type MimeGroup = 'audio' | 'image' | 'text'

const TEXT_MIME_TYPES = ['application/pdf', 'application/xml', 'text/plain']

const mimeGroup = (mimeType: string): MimeGroup | null => {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (TEXT_MIME_TYPES.includes(mimeType)) return 'text'

  return null
}

/**
 * Свёртывает MIME-типы перетаскивания в множество предугаданных групп файлов.
 * Неизвестные MIME-типы молча игнорируются. Функция чистая.
 * @param mimeTypes - MIME-типы элементов перетаскивания (без имён файлов).
 */
export const predictedMimeGroups = (mimeTypes: readonly string[]): ReadonlySet<MimeGroup> => {
  const groups = new Set<MimeGroup>()

  for (const mimeType of mimeTypes) {
    const group = mimeGroup(mimeType)
    if (group) groups.add(group)
  }

  return groups
}

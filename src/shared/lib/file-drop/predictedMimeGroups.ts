// Группировка MIME-типов перетаскиваемых файлов до drop. Основной путь
// предугадывания — имя файла через `webkitGetAsEntry` (`predictDropKinds`);
// MIME-группа — запасной вариант, когда имени нет. Группы совпадают со
// строками `AdminFileKind` (`shared/lib/file-drop/fileKinds.ts`).

type MimeGroup = 'audio' | 'image' | 'text'

// `application/octet-stream` — запасной вариант, когда браузер не отдал ни имя,
// ни точный MIME. Ложная подсветка безвредна: финальная классификация всегда
// идёт по расширению на drop.
const TEXT_MIME_TYPES = [
  'application/octet-stream',
  'application/pdf',
  'application/xml',
  'text/plain',
  'text/xml',
]

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

import { type DraggedItem } from './dropTracker'
import { type AdminFileKind, detectFileKind } from './fileKinds'
import { predictedMimeGroups } from './predictedMimeGroups'

/**
 * Предугадывает виды перетаскиваемых файлов до drop. Если браузер отдал имя
 * (`webkitGetAsEntry`), вид берётся по расширению — так ловится FB2, у которого
 * системного MIME обычно нет. Иначе MIME-тип сворачивается в группу
 * `predictedMimeGroups`. Элементы без имени и MIME-типа предугадать нельзя:
 * до drop браузер о них молчит. Функция чистая.
 * @param items - Файловые элементы `dataTransfer.items` (до drop).
 */
export const predictDropKinds = (items: ReadonlyArray<DraggedItem>): ReadonlySet<AdminFileKind> => {
  const kinds = new Set<AdminFileKind>()

  for (const { name, type } of items) {
    const kindByExtension = name ? detectFileKind(name) : null
    if (kindByExtension) {
      kinds.add(kindByExtension)
      continue
    }

    for (const group of predictedMimeGroups([type])) kinds.add(group)
  }

  return kinds
}

import { type DraggedItem } from './dropTracker'

type DropHandler = (files: File[]) => void

const NO_DRAGGED_ITEMS: ReadonlyArray<DraggedItem> = []

/**
 * На native нет системного drag & drop: хук всегда сообщает
 * `isDragActive: false`, пустой список `draggedItems` и не вызывает обработчик.
 * Веб-реализация — `useFileDrop.web.ts`.
 * @param _onFiles - Потребитель брошенных файлов (на native не вызывается).
 */
export const useFileDrop = (_onFiles: DropHandler) => ({
  draggedItems: NO_DRAGGED_ITEMS,
  isDragActive: false,
})

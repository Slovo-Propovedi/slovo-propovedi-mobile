type DropHandler = (files: File[]) => void

const NO_DRAGGED_MIME_TYPES: readonly string[] = []

/**
 * На native нет системного drag & drop: хук всегда сообщает
 * `isDragActive: false`, пустой список `draggedMimeTypes` и не вызывает
 * обработчик. Веб-реализация — `useFileDrop.web.ts`.
 * @param _onFiles - Потребитель брошенных файлов (на native не вызывается).
 */
export const useFileDrop = (_onFiles: DropHandler) => ({
  draggedMimeTypes: NO_DRAGGED_MIME_TYPES,
  isDragActive: false,
})

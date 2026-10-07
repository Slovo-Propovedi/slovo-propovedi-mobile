type DropHandler = (files: File[]) => void

/**
 * На native нет системного drag & drop: хук всегда сообщает
 * `isDragActive: false` и не вызывает обработчик. Веб-реализация —
 * `useSermonFileDrop.web.ts`.
 * @param _onFiles - Потребитель брошенных файлов (на native не вызывается).
 */
export const useSermonFileDrop = (_onFiles: DropHandler) => ({ isDragActive: false })

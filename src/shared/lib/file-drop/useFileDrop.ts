type DropHandler = (files: File[]) => void

/**
 * На native нет системного drag & drop: хук всегда сообщает
 * `isDragActive: false` и не вызывает обработчик. Веб-реализация —
 * `useFileDrop.web.ts`.
 * @param _onFiles - Потребитель брошенных файлов (на native не вызывается).
 */
export const useFileDrop = (_onFiles: DropHandler) => ({ isDragActive: false })

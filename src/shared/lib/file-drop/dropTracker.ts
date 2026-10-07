// Чистая машина состояний drag & drop для веб-форм: отличает перетаскивание
// файлов от перетаскивания текста/ссылок и считает вложенные dragenter/leave,
// чтобы подсказка не мигала. Веб-хук `useFileDrop.web.ts` — тонкая обёртка над
// трекером.

interface DragPayload {
  dataTransfer: { files: ArrayLike<File>; types: readonly string[] } | null
  preventDefault: () => void
}

interface DropTracker {
  dragEnter: (event: DragPayload) => void
  dragLeave: () => void
  dragOver: (event: DragPayload) => void
  drop: (event: DragPayload) => File[] | null
  readonly isDragActive: boolean
  reset: () => void
}

const dragsFiles = ({ dataTransfer }: DragPayload): boolean =>
  dataTransfer?.types.includes('Files') ?? false

/**
 * Создаёт трекер перетаскивания файлов. Не-файловые перетаскивания полностью
 * игнорируются: счётчик не растёт, `preventDefault` не вызывается, поэтому
 * браузерные перетаскивания текста в поля продолжают работать. Файловый drop
 * отдаёт список файлов и сбрасывает состояние; пустой (без файлов) — возвращает
 * `null`, не перехватывая событие.
 */
export const createDropTracker = (): DropTracker => {
  let dragDepth = 0
  let isDragActive = false

  return {
    dragEnter(event) {
      if (!dragsFiles(event)) return
      event.preventDefault()
      dragDepth += 1
      isDragActive = true
    },
    dragLeave() {
      dragDepth = Math.max(0, dragDepth - 1)
      if (dragDepth === 0) isDragActive = false
    },
    dragOver(event) {
      if (dragsFiles(event)) event.preventDefault()
    },
    drop(event) {
      if (!dragsFiles(event)) return null
      event.preventDefault()
      dragDepth = 0
      isDragActive = false
      return Array.from(event.dataTransfer?.files ?? [])
    },
    get isDragActive() {
      return isDragActive
    },
    reset() {
      dragDepth = 0
      isDragActive = false
    },
  }
}

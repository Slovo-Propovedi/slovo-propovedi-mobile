// Чистая машина состояний drag & drop для веб-форм: отличает перетаскивание
// файлов от перетаскивания текста/ссылок и считает вложенные dragenter/leave,
// чтобы подсказка не мигала. Веб-хук `useFileDrop.web.ts` — тонкая обёртка над
// трекером. До drop имена файлов недоступны, поэтому виды предугадываются по
// MIME-типам элементов (`dataTransfer.items`), которые браузер отдаёт уже на
// dragenter/dragover.

interface DragItem {
  kind: string
  type: string
}

interface DragPayload {
  dataTransfer: {
    files: ArrayLike<File>
    items?: ArrayLike<DragItem>
    types: readonly string[]
  } | null
  preventDefault: () => void
}

interface DropTracker {
  dragEnter: (event: DragPayload) => void
  readonly draggedMimeTypes: readonly string[]
  dragLeave: () => void
  dragOver: (event: DragPayload) => void
  drop: (event: DragPayload) => File[] | null
  readonly isDragActive: boolean
  reset: () => void
}

const dragsFiles = ({ dataTransfer }: DragPayload): boolean =>
  dataTransfer?.types.includes('Files') ?? false

const collectFileMimeTypes = ({ dataTransfer }: DragPayload): string[] =>
  dataTransfer?.items
    ? Array.from(dataTransfer.items)
        .filter(item => item.kind === 'file' && item.type)
        .map(item => item.type)
    : []

/**
 * Создаёт трекер перетаскивания файлов. Не-файловые перетаскивания полностью
 * игнорируются: счётчик не растёт, `preventDefault` не вызывается, поэтому
 * браузерные перетаскивания текста в поля продолжают работать. Файловый drop
 * отдаёт список файлов и сбрасывает состояние; пустой (без файлов) — возвращает
 * `null`, не перехватывая событие. `draggedMimeTypes` собирается из items на
 * enter/over, хранит последнее непустое значение, пока перетаскивание активно,
 * и очищается вместе с состоянием.
 */
export const createDropTracker = (): DropTracker => {
  let dragDepth = 0
  let isDragActive = false
  let draggedMimeTypes: string[] = []

  const rememberMimeTypes = (event: DragPayload) => {
    const mimeTypes = collectFileMimeTypes(event)
    if (mimeTypes.length > 0) draggedMimeTypes = mimeTypes
  }

  const deactivate = () => {
    isDragActive = false
    draggedMimeTypes = []
  }

  return {
    dragEnter(event) {
      if (!dragsFiles(event)) return
      event.preventDefault()
      dragDepth += 1
      isDragActive = true
      rememberMimeTypes(event)
    },
    get draggedMimeTypes() {
      return draggedMimeTypes
    },
    dragLeave() {
      dragDepth = Math.max(0, dragDepth - 1)
      if (dragDepth === 0) deactivate()
    },
    dragOver(event) {
      if (!dragsFiles(event)) return
      event.preventDefault()
      rememberMimeTypes(event)
    },
    drop(event) {
      if (!dragsFiles(event)) return null
      event.preventDefault()
      dragDepth = 0
      deactivate()
      return Array.from(event.dataTransfer?.files ?? [])
    },
    get isDragActive() {
      return isDragActive
    },
    reset() {
      dragDepth = 0
      deactivate()
    },
  }
}

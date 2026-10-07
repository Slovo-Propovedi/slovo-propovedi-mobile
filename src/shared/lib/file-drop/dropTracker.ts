// Чистая машина состояний drag & drop для веб-форм: отличает перетаскивание
// файлов от перетаскивания текста/ссылок и считает вложенные dragenter/leave,
// чтобы подсказка не мигала. Веб-хук `useFileDrop.web.ts` — тонкая обёртка над
// трекером. До drop браузер не отдаёт содержимое файлов, но имя можно добыть
// через `DataTransferItem.webkitGetAsEntry()` (классификация по расширению), а
// когда имени нет — виды предугадываются по MIME-типам (`dataTransfer.items`).

export interface DraggedItem {
  name?: null | string
  type: string
}

interface DragItem {
  kind: string
  name?: null | string
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
  readonly draggedItems: ReadonlyArray<DraggedItem>
  dragLeave: () => void
  dragOver: (event: DragPayload) => void
  drop: (event: DragPayload) => File[] | null
  readonly isDragActive: boolean
  reset: () => void
}

const dragsFiles = ({ dataTransfer }: DragPayload): boolean =>
  dataTransfer?.types.includes('Files') ?? false

// Файловые элементы с именем (даже без MIME — так приходит FB2) или с MIME.
// Элемент без имени и без MIME предугадать нельзя — отбрасываем.
const collectFileItems = ({ dataTransfer }: DragPayload): DraggedItem[] =>
  dataTransfer?.items
    ? Array.from(dataTransfer.items)
        .filter(item => item.kind === 'file' && (item.type !== '' || Boolean(item.name)))
        .map(({ name, type }) => ({ name: name ?? null, type }))
    : []

const itemsSignature = (items: ReadonlyArray<DraggedItem>) =>
  items.map(({ name, type }) => `${name ?? ''}\u0000${type}`).join('\n')

/**
 * Создаёт трекер перетаскивания файлов. Не-файловые перетаскивания полностью
 * игнорируются: счётчик не растёт, `preventDefault` не вызывается, поэтому
 * браузерные перетаскивания текста в поля продолжают работать. Файловый drop
 * отдаёт список файлов и сбрасывает состояние; пустой (без файлов) — возвращает
 * `null`, не перехватывая событие. `draggedItems` собирается из items на
 * enter/over, хранит последнее непустое значение, пока перетаскивание активно,
 * и очищается вместе с состоянием. Пока подпись (имя + MIME) не изменилась,
 * массив не пересоздаётся — иначе каждый `dragover` давал бы потребителю новый
 * reference и лишний ререндер.
 */
export const createDropTracker = (): DropTracker => {
  let dragDepth = 0
  let isDragActive = false
  let draggedItems: DraggedItem[] = []
  let draggedItemsSignature = ''

  const rememberItems = (event: DragPayload) => {
    const items = collectFileItems(event)
    if (items.length === 0) return

    const signature = itemsSignature(items)
    if (signature === draggedItemsSignature) return

    draggedItems = items
    draggedItemsSignature = signature
  }

  const deactivate = () => {
    isDragActive = false
    draggedItems = []
    draggedItemsSignature = ''
  }

  return {
    dragEnter(event) {
      if (!dragsFiles(event)) return
      event.preventDefault()
      dragDepth += 1
      isDragActive = true
      rememberItems(event)
    },
    get draggedItems() {
      return draggedItems
    },
    dragLeave() {
      dragDepth = Math.max(0, dragDepth - 1)
      if (dragDepth === 0) deactivate()
    },
    dragOver(event) {
      if (!dragsFiles(event)) return
      event.preventDefault()
      rememberItems(event)
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

import { useEffect, useRef, useState } from 'react'
import { createDropTracker, type DraggedItem } from './dropTracker'

type DropHandler = (files: File[]) => void

// Имя файла доступно до drop через entry-API (Chrome/Edge/Firefox/Safari).
// `webkitGetAsEntry` вызывается ровно один раз на элемент: Chrome отдаёт null
// при повторном вызове, и имя пропадает. Некоторые окружения entry не отдают —
// тогда имя null, и вид предугадывается по MIME.
const toDragItem = (item: DataTransferItem) => {
  let entry: FileSystemEntry | null
  try {
    entry = item.webkitGetAsEntry()
  } catch {
    entry = null
  }

  return { kind: item.kind, name: entry?.name ?? null, type: item.type }
}

const toDragPayload = (event: DragEvent) => {
  const { dataTransfer } = event
  const items = dataTransfer ? Array.from(dataTransfer.items).map(toDragItem) : undefined

  return {
    dataTransfer: dataTransfer
      ? { files: dataTransfer.files, items, types: dataTransfer.types }
      : null,
    preventDefault: () => event.preventDefault(),
  }
}

/**
 * Веб-реализация drop: слушает перетаскивание файлов на уровне окна и отдаёт
 * брошенные файлы наверх. Машина состояний — `createDropTracker`: счётчик
 * вложенных dragenter/dragleave даёт `isDragActive`, а не-файловое
 * перетаскивание (текст, ссылки) полностью игнорируется, чтобы не ломать
 * браузерные перетаскивания и не мигать подсказкой. `draggedItems` — элементы с
 * именами (через `webkitGetAsEntry`) и MIME-типами, предугаданные до drop.
 * @param onFiles - Потребитель брошенных файлов.
 */
export const useFileDrop = (onFiles: DropHandler) => {
  const [isDragActive, setIsDragActive] = useState(false)
  const [draggedItems, setDraggedItems] = useState<ReadonlyArray<DraggedItem>>([])
  const onFilesRef = useRef(onFiles)

  useEffect(() => {
    onFilesRef.current = onFiles
  }, [onFiles])

  useEffect(() => {
    const tracker = createDropTracker()
    let lastIsDragActive = tracker.isDragActive
    let lastDraggedItems = tracker.draggedItems

    const syncDragState = () => {
      const nextIsDragActive = tracker.isDragActive
      const nextDraggedItems = tracker.draggedItems
      const isUnchanged =
        nextIsDragActive === lastIsDragActive && nextDraggedItems === lastDraggedItems
      if (isUnchanged) return

      lastIsDragActive = nextIsDragActive
      lastDraggedItems = nextDraggedItems
      setIsDragActive(nextIsDragActive)
      setDraggedItems(nextDraggedItems)
    }

    const onDragEnter = (event: DragEvent) => {
      tracker.dragEnter(toDragPayload(event))
      syncDragState()
    }

    const onDragOver = (event: DragEvent) => {
      tracker.dragOver(toDragPayload(event))
      syncDragState()
    }

    const onDragLeave = () => {
      tracker.dragLeave()
      syncDragState()
    }

    const onDragEnd = () => {
      tracker.reset()
      syncDragState()
    }

    const onDrop = (event: DragEvent) => {
      const files = tracker.drop(toDragPayload(event))
      syncDragState()
      if (files?.length) onFilesRef.current(files)
    }

    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('dragend', onDragEnd)
    window.addEventListener('drop', onDrop)

    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('dragend', onDragEnd)
      window.removeEventListener('drop', onDrop)
    }
  }, [])

  return { draggedItems, isDragActive }
}

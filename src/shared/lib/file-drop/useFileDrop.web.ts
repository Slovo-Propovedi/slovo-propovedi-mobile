import { useEffect, useRef, useState } from 'react'
import { createDropTracker } from './dropTracker'

type DropHandler = (files: File[]) => void

/**
 * Веб-реализация drop: слушает перетаскивание файлов на уровне окна и отдаёт
 * брошенные файлы наверх. Машина состояний — `createDropTracker`: счётчик
 * вложенных dragenter/dragleave даёт `isDragActive`, а не-файловое
 * перетаскивание (текст, ссылки) полностью игнорируется, чтобы не ломать
 * браузерные перетаскивания и не мигать подсказкой. `draggedMimeTypes` —
 * предугаданные до drop MIME-типы (виды файлов), нужные оверлею-подсказке.
 * @param onFiles - Потребитель брошенных файлов.
 */
export const useFileDrop = (onFiles: DropHandler) => {
  const [isDragActive, setIsDragActive] = useState(false)
  const [draggedMimeTypes, setDraggedMimeTypes] = useState<readonly string[]>([])
  const onFilesRef = useRef(onFiles)

  useEffect(() => {
    onFilesRef.current = onFiles
  }, [onFiles])

  useEffect(() => {
    const tracker = createDropTracker()
    let lastIsDragActive = tracker.isDragActive
    let lastDraggedMimeTypes = tracker.draggedMimeTypes

    const syncDragState = () => {
      const nextIsDragActive = tracker.isDragActive
      const nextDraggedMimeTypes = tracker.draggedMimeTypes
      const isUnchanged =
        nextIsDragActive === lastIsDragActive &&
        nextDraggedMimeTypes.join() === lastDraggedMimeTypes.join()
      if (isUnchanged) return

      lastIsDragActive = nextIsDragActive
      lastDraggedMimeTypes = nextDraggedMimeTypes
      setIsDragActive(nextIsDragActive)
      setDraggedMimeTypes(nextDraggedMimeTypes)
    }

    const onDragEnter = (event: DragEvent) => {
      tracker.dragEnter(event)
      syncDragState()
    }

    const onDragOver = (event: DragEvent) => {
      tracker.dragOver(event)
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
      const files = tracker.drop(event)
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

  return { draggedMimeTypes, isDragActive }
}

import { useEffect, useRef, useState } from 'react'
import { createDropTracker } from './dropTracker'

type DropHandler = (files: File[]) => void

/**
 * Веб-реализация drop: слушает перетаскивание файлов на уровне окна и отдаёт
 * брошенные файлы наверх. Машина состояний — `createDropTracker`: счётчик
 * вложенных dragenter/dragleave даёт `isDragActive`, а не-файловое
 * перетаскивание (текст, ссылки) полностью игнорируется, чтобы не ломать
 * браузерные перетаскивания и не мигать подсказкой.
 * @param onFiles - Потребитель брошенных файлов.
 */
export const useSermonFileDrop = (onFiles: DropHandler) => {
  const [isDragActive, setIsDragActive] = useState(false)
  const onFilesRef = useRef(onFiles)

  useEffect(() => {
    onFilesRef.current = onFiles
  }, [onFiles])

  useEffect(() => {
    const tracker = createDropTracker()
    const syncDragActive = () => setIsDragActive(tracker.isDragActive)

    const onDragEnter = (event: DragEvent) => {
      tracker.dragEnter(event)
      syncDragActive()
    }

    const onDragOver = (event: DragEvent) => tracker.dragOver(event)

    const onDragLeave = () => {
      tracker.dragLeave()
      syncDragActive()
    }

    const onDragEnd = () => {
      tracker.reset()
      syncDragActive()
    }

    const onDrop = (event: DragEvent) => {
      const files = tracker.drop(event)
      syncDragActive()
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

  return { isDragActive }
}

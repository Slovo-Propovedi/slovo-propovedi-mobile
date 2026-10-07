import { useEffect, useRef, useState } from 'react'

type DropHandler = (files: File[]) => void

/**
 * Веб-реализация drop: слушает перетаскивание файлов на уровне окна и отдаёт
 * брошенные файлы наверх. Счётчик dragenter/dragleave различает вход и выход
 * курсора с учётом вложенных элементов, чтобы подсказка не мигала; dragend и
 * drop сбрасывают счётчик.
 * @param onFiles - Потребитель брошенных файлов.
 */
export const useSermonFileDrop = (onFiles: DropHandler) => {
  const [isDragActive, setIsDragActive] = useState(false)
  const onFilesRef = useRef(onFiles)
  const dragDepthRef = useRef(0)

  useEffect(() => {
    onFilesRef.current = onFiles
  }, [onFiles])

  useEffect(() => {
    const onDragEnter = (event: DragEvent) => {
      event.preventDefault()
      dragDepthRef.current += 1
      setIsDragActive(true)
    }

    const onDragOver = (event: DragEvent) => {
      event.preventDefault()
    }

    const onDragLeave = () => {
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
      if (dragDepthRef.current === 0) setIsDragActive(false)
    }

    const reset = () => {
      dragDepthRef.current = 0
      setIsDragActive(false)
    }

    const onDrop = (event: DragEvent) => {
      reset()

      const files = Array.from(event.dataTransfer?.files ?? [])
      if (files.length === 0) return

      event.preventDefault()
      onFilesRef.current(files)
    }

    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('dragend', reset)
    window.addEventListener('drop', onDrop)

    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('dragend', reset)
      window.removeEventListener('drop', onDrop)
    }
  }, [])

  return { isDragActive }
}

import { useAction } from '@reatom/npm-react'
import { useCallback, useRef, useState } from 'react'
import {
  type AdminFileKind,
  detectFileKind,
  getFileKindConfig,
  getFileKindSuccessMessage,
  isAllowedExtension,
} from 'widgets/admin-form-pickers'
import { uploadSermonFile } from 'shared/api'
import { getErrorMessage } from 'shared/lib/error-utils'
import { showToast } from 'shared/model'
import { type SermonFormValues } from './sermonFormInitialValues'

interface ClassifiedFile {
  file: File
  kind: AdminFileKind
}

interface DroppedMediaUploadStatus {
  currentFileName: null | string
  error: null | string
  isUploading: boolean
  progress: number
}

type UpdateField = <K extends keyof SermonFormValues>(key: K, value: SermonFormValues[K]) => void

const FIELD_BY_KIND = { audio: 'audioUrl', image: 'artwork', text: 'textFileUrl' } as const

// Порядок загрузки при батч-сбросе: обложка, затем аудио, затем текст.
const UPLOAD_ORDER: AdminFileKind[] = ['image', 'audio', 'text']

const IDLE_STATUS: DroppedMediaUploadStatus = {
  currentFileName: null,
  error: null,
  isUploading: false,
  progress: 0,
}

// Оставляет по одному файлу на вид (первый побеждает) и упорядочивает их.
const collectClassifiedFiles = (files: File[]): ClassifiedFile[] => {
  const firstByKind = new Map<AdminFileKind, File>()
  for (const file of files) {
    const kind = detectFileKind(file.name, file.type)
    if (kind !== null && !firstByKind.has(kind)) firstByKind.set(kind, file)
  }

  return UPLOAD_ORDER.flatMap(kind => {
    const file = firstByKind.get(kind)

    return file ? [{ file, kind }] : []
  })
}

/**
 * Загружает файлы, брошенные на форму проповеди: раскладывает их по видам
 * (обложка/аудио/текст) и грузит тем же `uploadSermonFile`, что и кнопки
 * «Загрузить». Неизвестные типы молча игнорируются.
 * @param onChange - Сеттер поля формы, принимающий URL загруженного файла.
 */
export const useDroppedMediaUpload = (onChange: UpdateField) => {
  const showToastAction = useAction(showToast)
  const [status, setStatus] = useState<DroppedMediaUploadStatus>(IDLE_STATUS)
  const isUploadingRef = useRef(false)

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (isUploadingRef.current) return

      const classified = collectClassifiedFiles(files)
      if (classified.length === 0) return

      const rejected = classified.find(({ file, kind }) => !isAllowedExtension(kind, file.name))
      if (rejected) {
        const message = getFileKindConfig(rejected.kind).rejectMessage
        setStatus({ ...IDLE_STATUS, error: message })
        showToastAction(message)
        return
      }

      isUploadingRef.current = true
      setStatus({ ...IDLE_STATUS, isUploading: true })

      try {
        for (const { file, kind } of classified) {
          setStatus(previous => ({ ...previous, currentFileName: file.name, progress: 0 }))
          const objectUrl = URL.createObjectURL(file)

          try {
            const uploaded = await uploadSermonFile(
              { mimeType: file.type, name: file.name, size: file.size, uri: objectUrl },
              { onProgress: progress => setStatus(previous => ({ ...previous, progress })) },
            )
            onChange(FIELD_BY_KIND[kind], uploaded.fileUrl)
            showToastAction(getFileKindSuccessMessage(kind))
          } finally {
            URL.revokeObjectURL(objectUrl)
          }
        }
        setStatus(IDLE_STATUS)
      } catch (uploadError) {
        const message = getErrorMessage(uploadError)
        setStatus({ ...IDLE_STATUS, error: message })
        showToastAction(message)
      } finally {
        isUploadingRef.current = false
      }
    },
    [onChange, showToastAction],
  )

  return { handleFiles, status }
}

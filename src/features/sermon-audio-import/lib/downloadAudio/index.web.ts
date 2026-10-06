import { uploadAudioBlob } from 'shared/api'
import { type DownloadAudio, type DownloadProgress } from './types'

const PROGRESS_MAX = 100

const readAudioBlob = async (
  response: Response,
  mimeType: string,
  onProgress: DownloadProgress,
): Promise<Blob> => {
  // Content-Length может отсутствовать (chunked-ответ): процент не выдумываем —
  // UI показывает метку фазы без числа, пока скачивание не завершится.
  const contentLength = Number(response.headers.get('Content-Length')) || 0

  if (!response.body) {
    onProgress(PROGRESS_MAX)
    return new Blob([await response.arrayBuffer()], { type: mimeType })
  }

  const reader = response.body.getReader()
  const chunks: BlobPart[] = []
  let receivedBytes = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    // Копия даёт ArrayBuffer-backed view, который BlobPart принимает без assertion.
    chunks.push(new Uint8Array(value))
    receivedBytes += value.length
    if (contentLength > 0)
      onProgress(Math.min(PROGRESS_MAX, Math.round((receivedBytes / contentLength) * PROGRESS_MAX)))
  }
  // Без Content-Length промежуточный процент неизвестен — отдаём 0 в начале и
  // 100 по завершении; с заголовком 100 уже отдан на последнем чанке.
  if (contentLength <= 0) onProgress(PROGRESS_MAX)

  return new Blob(chunks, { type: mimeType })
}

/**
 * Веб-путь: стримит аудио через fetch в память (без временных файлов) и отдаёт
 * объект, который умеет загрузить собранный Blob на сервер и ничего не удаляет.
 * Ошибки скачивания остаются сырыми — общий код импорта отображает их в
 * «сервис недоступен».
 * @param input - Ссылка на аудио, имя файла и mime-тип.
 * @param onProgress - Процент скачивания 0–100 (0, если Content-Length нет).
 * @param signal - Отмена скачивания (например, размонтирование формы).
 */
export const downloadAudio: DownloadAudio = async (input, onProgress, signal) => {
  onProgress(0)

  const response = await fetch(input.audioUrl, { signal })
  if (!response.ok) throw new Error(`Failed to download audio: ${response.status}`)

  const audioBlob = await readAudioBlob(response, input.mimeType, onProgress)

  return {
    dispose: () => undefined,
    size: audioBlob.size,
    upload: async onUpload => {
      const uploaded = await uploadAudioBlob(audioBlob, input.fileName, { onProgress: onUpload })

      return uploaded.fileUrl
    },
  }
}

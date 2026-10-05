// Контракт шага «скачать аудио → отдать его на загрузку»: реализация
// выбирается платформой (Metro) между `.native.ts` и `.web.ts`, а общий код
// импорта работает с этим интерфейсом и не знает про файлы/блобы.

export type DownloadAudio = (
  input: DownloadAudioInput,
  onProgress: DownloadProgress,
  signal: AbortSignal | undefined,
) => Promise<DownloadedAudio>

export interface DownloadedAudio {
  /** Освобождает ресурсы скачивания (на web — no-op). */
  dispose: () => void
  /** Размер скачанного файла в байтах (диагностика загрузки). */
  size: number
  /** Загружает скачанное аудио на сервер, сообщая прогресс; возвращает URL. */
  upload: (onProgress: DownloadProgress) => Promise<string>
}

export type DownloadProgress = (percent: number) => void

interface DownloadAudioInput {
  audioUrl: string
  fileName: string
  mimeType: string
}

// Контракты импорта проповеди из YouTube/Invidious: источники, фазы
// прогресса и результат, который подставляется в форму админки.

export interface ImportedSermonData {
  audioUrl: null | string
  description: null | string
  title: string
}

// Метаданные доступны сразу после разбора ссылки — до скачивания аудио. Их
// форма принимает первой, чтобы админ видел название и описание без ожидания.
export interface ImportedSermonMetadata {
  description: null | string
  title: string
}

export type ImportErrorCode =
  | 'live'
  | 'login-required'
  | 'no-audio'
  | 'parse'
  | 'service-unavailable'
  | 'upload-failed'
  | 'video-unavailable'

export type ImportPhase = 'download' | 'upload'

export interface ImportPhaseProgress {
  percent: number
  phase: ImportPhase
}

export interface ImportSettings {
  invidiousBaseUrl: string
  source: ImportSource
}

export type ImportSource = 'invidious' | 'youtube'

export interface ResolvedAudio {
  audioUrl: string
  description: null | string
  title: string
  videoId: string
}

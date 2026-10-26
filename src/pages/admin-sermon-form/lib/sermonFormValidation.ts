import {
  artworkUrlError,
  fileUrlError,
  maxItemsError,
  maxLengthError,
  urlError,
} from 'shared/lib/validation/formValidation'
import { INPUT_LIMITS } from 'shared/lib/validation/inputLimits'
import { type SermonFormValues } from './sermonFormInitialValues'

/**
 * Границы спецификации для формы проповеди: длины полей, формат медиа-ссылок и
 * размер массива плейлистов. '' — значения в допустимых пределах.
 * @param values - Текущие значения формы.
 */
export const sermonValidationError = (values: SermonFormValues): string =>
  maxLengthError(values.title, INPUT_LIMITS.sermon.title, 'Название') ||
  maxLengthError(values.artist, INPUT_LIMITS.sermon.artist, 'Проповедник') ||
  maxLengthError(values.book, INPUT_LIMITS.sermon.book, 'Книга') ||
  maxLengthError(values.description, INPUT_LIMITS.sermon.description, 'Описание') ||
  maxLengthError(values.artwork, INPUT_LIMITS.sermon.artwork, 'Обложка') ||
  artworkUrlError(values.artwork, 'Обложка') ||
  maxLengthError(values.youtubeUrl, INPUT_LIMITS.sermon.youtubeUrl, 'YouTube') ||
  urlError(values.youtubeUrl, 'YouTube') ||
  maxLengthError(values.audioUrl, INPUT_LIMITS.sermon.audioUrl, 'Аудио') ||
  fileUrlError(values.audioUrl, 'Аудио') ||
  maxLengthError(values.textFileUrl, INPUT_LIMITS.sermon.textFileUrl, 'Текст') ||
  fileUrlError(values.textFileUrl, 'Текст') ||
  maxItemsError(values.selectedPlaylistIds.length, INPUT_LIMITS.sermon.playlists, 'Плейлисты')

import {
  artworkUrlError,
  maxItemsError,
  maxLengthError,
} from 'shared/lib/validation/formValidation'
import { INPUT_LIMITS } from 'shared/lib/validation/inputLimits'
import { type PlaylistFormValues } from './playlistFormState'

/**
 * Границы спецификации для формы плейлиста: длины полей и размеры массивов
 * связей. '' — значения в допустимых пределах.
 * @param values - Текущие значения формы.
 */
export const playlistValidationError = (values: PlaylistFormValues): string =>
  maxLengthError(values.title, INPUT_LIMITS.playlist.title, 'Название') ||
  maxLengthError(values.description, INPUT_LIMITS.playlist.description, 'Описание') ||
  maxLengthError(values.artwork, INPUT_LIMITS.playlist.artwork, 'Обложка') ||
  artworkUrlError(values.artwork, 'Обложка') ||
  maxItemsError(values.selectedSermonIds.length, INPUT_LIMITS.playlist.sermons, 'Проповеди') ||
  maxItemsError(values.selectedSectionIds.length, INPUT_LIMITS.playlist.sections, 'Разделы')

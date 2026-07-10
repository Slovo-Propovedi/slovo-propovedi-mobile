import { PlayerControlsSize } from './PlayerControls.types'

type PlayerControlsVariant = 'default' | 'fullscreen'

interface UsePlayerControlSizesParams {
  size?: PlayerControlsSize
  variant?: PlayerControlsVariant
}

interface UsePlayerControlSizesResult {
  buttonSize: number
  isFullscreen: boolean
  playButtonSize: number
}

/**
 * Определяет размеры кнопок управления плеером
 * на основе варианта отображения и базового размера.
 * @param root0 - Параметры размеров.
 * @param root0.size - Базовый размер кнопок.
 * @param root0.variant - Вариант отображения.
 */
export const usePlayerControlSizes = ({
  size = PlayerControlsSize.Large,
  variant = 'default',
}: UsePlayerControlSizesParams): UsePlayerControlSizesResult => {
  const isFullscreen = variant === 'fullscreen'

  const buttonSize = isFullscreen ? 24 : size

  const playButtonSize = buttonSize * 2

  return {
    buttonSize,
    isFullscreen,
    playButtonSize,
  }
}

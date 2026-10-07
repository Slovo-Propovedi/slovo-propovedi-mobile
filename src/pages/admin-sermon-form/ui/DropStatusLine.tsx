import { Text } from 'react-native'
import { COLORS, useTheme } from 'shared/ui/theme'
import { styles } from './styles'

// Статус фоновой загрузки брошенных файлов: прогресс или ошибка. Подсказку о
// drag & drop рисует полноэкранный оверлей (`DropOverlay`), поэтому её здесь нет.
export const DropStatusLine = ({
  currentFileName,
  error,
  isUploading,
  progress,
}: {
  currentFileName: null | string
  error: null | string
  isUploading: boolean
  progress: number
}) => {
  const { currentTheme } = useTheme()
  const progressStyle = [styles.dropStatus, { color: currentTheme.textMuted }]

  if (error) return <Text style={[styles.dropStatus, { color: COLORS.error }]}>{error}</Text>
  if (isUploading)
    return <Text style={progressStyle}>{`Загрузка ${currentFileName ?? ''}… ${progress}%`}</Text>

  return null
}

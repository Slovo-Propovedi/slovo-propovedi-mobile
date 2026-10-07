import { Text } from 'react-native'
import { COLORS, useTheme } from 'shared/ui/theme'
import { styles } from './styles'

const DROP_HINT = 'Отпустите файлы, чтобы прикрепить их'

// Подсказка о drag & drop и статусе фоновой загрузки брошенных файлов.
export const DropStatusLine = ({
  currentFileName,
  error,
  isDragActive,
  isUploading,
  progress,
}: {
  currentFileName: null | string
  error: null | string
  isDragActive: boolean
  isUploading: boolean
  progress: number
}) => {
  const { currentTheme } = useTheme()
  const hintStyle = [styles.dropStatus, { color: currentTheme.textMuted }]

  if (error) return <Text style={[styles.dropStatus, { color: COLORS.error }]}>{error}</Text>
  if (isUploading)
    return <Text style={hintStyle}>{`Загрузка ${currentFileName ?? ''}… ${progress}%`}</Text>
  if (isDragActive) return <Text style={hintStyle}>{DROP_HINT}</Text>

  return null
}

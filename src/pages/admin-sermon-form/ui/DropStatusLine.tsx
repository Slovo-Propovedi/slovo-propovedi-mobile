import { Text } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

const DROP_HINT = 'Отпустите файлы, чтобы прикрепить их'

interface DropStatus {
  currentFileName: null | string
  error: null | string
  isDragActive: boolean
  isUploading: boolean
  progress: number
}

const statusMessage = ({
  currentFileName,
  error,
  isDragActive,
  isUploading,
  progress,
}: DropStatus): null | string => {
  if (error) return error
  if (isUploading) return `Загрузка ${currentFileName ?? ''}… ${progress}%`
  if (isDragActive) return DROP_HINT

  return null
}

// Подсказка о drag & drop и статусе фоновой загрузки брошенных файлов.
export const DropStatusLine = (status: DropStatus) => {
  const { currentTheme } = useTheme()
  const message = statusMessage(status)
  if (!message) return null

  const color = status.error ? currentTheme.primary : currentTheme.textMuted

  return <Text style={[styles.dropStatus, { color }]}>{message}</Text>
}

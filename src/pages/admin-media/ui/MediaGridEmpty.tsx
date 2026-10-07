import { Text } from 'react-native'
import { EmptyState } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { AdminMediaGridSkeleton } from './AdminMediaGridSkeleton'
import { styles } from './styles'

const EMPTY_MESSAGE = 'Обложек пока нет'
const LOAD_ERROR = 'Не удалось загрузить файлы'

// Тело пустого каталога медиа: скелетон при первичной загрузке, текст ошибки или
// пустое состояние, когда файлов нет.
export const MediaGridEmpty = ({
  isError,
  isLoading,
  numColumns,
  tileSize,
}: {
  isError: boolean
  isLoading: boolean
  numColumns: number
  tileSize: number
}) => {
  const { currentTheme } = useTheme()

  if (isLoading) return <AdminMediaGridSkeleton tileSize={tileSize} numColumns={numColumns} />

  if (isError)
    return <Text style={[styles.error, { color: currentTheme.textMuted }]}>{LOAD_ERROR}</Text>

  return <EmptyState message={EMPTY_MESSAGE} />
}

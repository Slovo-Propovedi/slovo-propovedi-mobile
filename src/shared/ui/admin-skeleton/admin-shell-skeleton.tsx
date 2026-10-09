import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { AdminSermonRowSkeleton } from './admin-list-skeleton'
import { SkeletonBar } from './admin-skeleton-row'
import { styles } from './styles'

const ROW_COUNT = 6

// Плейсхолдер оболочки админки: заголовок и строки списка проповедей вместо
// полноэкранного спиннера, пока восстанавливается сессия. Появляется сразу
// после сплэша, чтобы интерфейс не «прыгал» на первый экран админки.
export const AdminShellSkeleton = () => {
  const insets = useSafeAreaInsets()
  const { currentTheme } = useTheme()

  return (
    <View
      style={[styles.shell, { backgroundColor: currentTheme.background, paddingTop: insets.top }]}
    >
      <SkeletonBar style={styles.shellTitle} />
      {Array.from({ length: ROW_COUNT }, (_, index) => (
        <AdminSermonRowSkeleton key={index} />
      ))}
    </View>
  )
}

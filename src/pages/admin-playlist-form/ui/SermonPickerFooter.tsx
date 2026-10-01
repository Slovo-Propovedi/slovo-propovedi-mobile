import { Text } from 'react-native'
import { AdminSermonRowSkeleton } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { pickerStyles } from './pickerStyles'

const LOAD_MORE_FAILED = 'Повторить загрузку'

// Футер пикера проповедей: пока идёт дозагрузка — скелетон-строка, при ошибке —
// тапабельное повторение. Ошибку показывает именно это состояние, а не общий
// футер списка, потому что `loadMore` живёт в `useSermonSearch`.
export const SermonPickerFooter = ({
  isLoadingMore,
  loadMoreFailed,
  onRetry,
}: {
  isLoadingMore: boolean
  loadMoreFailed: boolean
  onRetry: () => void
}) => {
  const { currentTheme } = useTheme()

  if (isLoadingMore) return <AdminSermonRowSkeleton />

  if (!loadMoreFailed) return null

  return (
    <TouchableItem
      onPress={onRetry}
      style={[pickerStyles.retry, { backgroundColor: currentTheme.surface }]}
    >
      <Text style={[pickerStyles.retryText, { color: currentTheme.primary }]}>
        {LOAD_MORE_FAILED}
      </Text>
    </TouchableItem>
  )
}

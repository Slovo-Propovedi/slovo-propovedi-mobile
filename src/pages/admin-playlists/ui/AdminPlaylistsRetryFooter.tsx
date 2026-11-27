import { Text } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { AdminPlaylistRow } from './AdminPlaylistRow'
import { styles } from './styles'

const LOAD_MORE_FAILED_LABEL = 'Повторить загрузку'

// List tail: a skeleton while the next page loads, otherwise a retry row after a
// failed loadMore. Renders nothing when there is nothing to report.
export const AdminPlaylistsRetryFooter = ({
  isLoadingMore,
  loadMoreFailed,
  onRetry,
}: {
  isLoadingMore: boolean
  loadMoreFailed: boolean
  onRetry: () => void
}) => {
  const { currentTheme } = useTheme()

  if (isLoadingMore) return <AdminPlaylistRow.Skeleton />
  if (!loadMoreFailed) return null

  return (
    <TouchableItem
      onPress={onRetry}
      style={[styles.retry, { backgroundColor: currentTheme.surface }]}
    >
      <Text style={[styles.retryText, { color: currentTheme.primary }]}>
        {LOAD_MORE_FAILED_LABEL}
      </Text>
    </TouchableItem>
  )
}

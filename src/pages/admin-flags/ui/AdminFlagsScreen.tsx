import { useAtom } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { FlatList, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRequireAdminRole } from 'entities/auth'
import { createRefreshControl, EmptyState, PullToRefresh } from 'shared/ui'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { useAdminFlags } from '../lib/useAdminFlags'
import { AdminFlagRow } from './AdminFlagRow'
import { AdminFlagsHeader } from './AdminFlagsHeader'
import { styles } from './styles'

const CREATE_ROUTE = '/admin/flags/create'
const EMPTY_MESSAGE = 'Флагов пока нет'
const LOAD_ERROR = 'Не удалось загрузить фича-флаги'
const SKELETON_ROWS = 6

const FlagSkeletonList = () => (
  <>
    {Array.from({ length: SKELETON_ROWS }, (_, index) => (
      <AdminFlagRow.Skeleton key={index} />
    ))}
  </>
)

// Список фича-флагов админки (только для роли admin): простой FlatList без
// пагинации и поиска, переход к детали/созданию.
export const AdminFlagsScreen = () => {
  useRequireAdminRole()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { currentTheme } = useTheme()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const { flags, isError, isLoading, isRefreshing, refresh } = useAdminFlags()

  const openFlag = (id: string) => {
    router.push({ params: { id }, pathname: '/admin/flags/[id]' })
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.background, paddingTop: insets.top },
      ]}
    >
      <PullToRefresh onRefresh={refresh} refreshing={isRefreshing}>
        <FlatList
          data={isLoading ? [] : flags}
          keyExtractor={item => item.id}
          refreshControl={createRefreshControl(isRefreshing, refresh, currentTheme.primary)}
          renderItem={({ item }) => <AdminFlagRow item={item} onPress={() => openFlag(item.id)} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + INDENTS.low },
          ]}
          ListHeaderComponent={
            <View style={styles.header}>
              <AdminFlagsHeader onCreate={() => router.push(CREATE_ROUTE)} />
            </View>
          }
          ListEmptyComponent={
            isLoading ? (
              <FlagSkeletonList />
            ) : isError ? (
              <Text style={[styles.error, { color: currentTheme.textMuted }]}>{LOAD_ERROR}</Text>
            ) : (
              <EmptyState message={EMPTY_MESSAGE} />
            )
          }
        />
      </PullToRefresh>
    </View>
  )
}

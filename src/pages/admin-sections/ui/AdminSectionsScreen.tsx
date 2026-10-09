import { useAtom } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { View } from 'react-native'
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { type APITypes } from 'shared/api'
import { createRefreshControl, EmptyState, PullToRefresh } from 'shared/ui'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { useAdminSections } from '../lib/useAdminSections'
import { AdminSectionRow } from './AdminSectionRow'
import { AdminSectionsHeader } from './AdminSectionsHeader'
import { styles } from './styles'

const CREATE_ROUTE = '/admin/sections/create'
const SKELETON_ROWS = 6

const SectionSkeletonList = () => (
  <>
    {Array.from({ length: SKELETON_ROWS }, (_, index) => (
      <AdminSectionRow.Skeleton key={index} />
    ))}
  </>
)

export const AdminSectionsScreen = () => {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { currentTheme } = useTheme()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const { isLoading, isRefreshing, isReordering, reload, reorder, sections } = useAdminSections()

  const openSection = (section: APITypes.SectionEntity) => {
    router.push({ params: { id: section.id }, pathname: '/admin/sections/[id]' })
  }

  const renderItem = ({ drag, isActive, item }: RenderItemParams<APITypes.SectionEntity>) => (
    <AdminSectionRow
      item={item}
      drag={drag}
      isActive={isActive}
      onPress={() => openSection(item)}
    />
  )

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.background, paddingTop: insets.top },
      ]}
    >
      <PullToRefresh onRefresh={reload} refreshing={isRefreshing}>
        <DraggableFlatList
          renderItem={renderItem}
          keyExtractor={item => item.id}
          data={isLoading ? [] : sections}
          containerStyle={styles.listContainer}
          onDragEnd={({ data }) => void reorder(data)}
          refreshControl={createRefreshControl(isRefreshing, reload, currentTheme.primary)}
          ListEmptyComponent={
            isLoading ? <SectionSkeletonList /> : <EmptyState message='Разделов пока нет' />
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + INDENTS.low },
          ]}
          ListHeaderComponent={
            <AdminSectionsHeader
              count={sections.length}
              onCreate={() => router.push(CREATE_ROUTE)}
            />
          }
          ListFooterComponent={
            isReordering ? (
              <View style={styles.reordering}>
                <AdminSectionRow.Skeleton />
              </View>
            ) : null
          }
        />
      </PullToRefresh>
    </View>
  )
}

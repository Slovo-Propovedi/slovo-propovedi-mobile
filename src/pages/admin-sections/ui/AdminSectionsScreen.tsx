import { useAtom } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { View } from 'react-native'
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist'
import { SafeAreaView } from 'react-native-safe-area-context'
import { type APITypes } from 'shared/api'
import { AdminSectionRowSkeleton, EmptyState } from 'shared/ui'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { INDENTS, PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import { useAdminSections } from '../lib/useAdminSections'
import { AdminSectionRow } from './AdminSectionRow'
import { AdminSectionsHeader } from './AdminSectionsHeader'
import { styles } from './styles'

const CREATE_ROUTE = '/admin/sections/create'
const SKELETON_ROWS = 6

const SectionSkeletonList = () => (
  <>
    {Array.from({ length: SKELETON_ROWS }, (_, index) => (
      <AdminSectionRowSkeleton key={index} />
    ))}
  </>
)

export const AdminSectionsScreen = () => {
  const router = useRouter()
  const { currentTheme } = useTheme()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const { isLoading, isReordering, reorder, sections } = useAdminSections()

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
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <DraggableFlatList
        renderItem={renderItem}
        keyExtractor={item => item.id}
        data={isLoading ? [] : sections}
        onDragEnd={({ data }) => void reorder(data)}
        ListEmptyComponent={
          isLoading ? <SectionSkeletonList /> : <EmptyState message='Разделов пока нет' />
        }
        ListHeaderComponent={
          <AdminSectionsHeader count={sections.length} onCreate={() => router.push(CREATE_ROUTE)} />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight + INDENTS.low },
        ]}
        ListFooterComponent={
          isReordering ? (
            <View style={styles.reordering}>
              <AdminSectionRowSkeleton />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  )
}

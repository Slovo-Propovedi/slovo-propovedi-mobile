import { useRouter } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist'
import { SafeAreaView } from 'react-native-safe-area-context'
import { type APITypes } from 'shared/api'
import { EmptyState } from 'shared/ui'
import { COLORS, useTheme } from 'shared/ui/theme'
import { useAdminSections } from '../lib/useAdminSections'
import { AdminSectionRow } from './AdminSectionRow'
import { AdminSectionsHeader } from './AdminSectionsHeader'
import { styles } from './styles'

const CREATE_ROUTE = '/admin/sections/create'

export const AdminSectionsScreen = () => {
  const router = useRouter()
  const { currentTheme } = useTheme()
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

  if (isLoading)
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.centered, { backgroundColor: currentTheme.background }]}
      >
        <ActivityIndicator size='large' color={COLORS.primary} />
      </SafeAreaView>
    )

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <DraggableFlatList
        data={sections}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        onDragEnd={({ data }) => void reorder(data)}
        ListEmptyComponent={<EmptyState message='Разделов пока нет' />}
        ListHeaderComponent={
          <AdminSectionsHeader count={sections.length} onCreate={() => router.push(CREATE_ROUTE)} />
        }
        ListFooterComponent={
          isReordering ? (
            <View style={styles.reordering}>
              <ActivityIndicator color={currentTheme.primary} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  )
}

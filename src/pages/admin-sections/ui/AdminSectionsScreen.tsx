import { useAtom } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { View } from 'react-native'
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  BLUR_TARGET_ROUTES,
  BlurBackdrop,
  createRefreshControl,
  EmptyState,
  getRefreshTopOffset,
  PullToRefresh,
  WideTopActions,
} from 'shared/ui'
import { tabBarHeightAtom, useIsWideLayout, useScreenChromePadding } from 'shared/ui/layout'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { type AdminSectionListItem } from '../lib/sectionListItem'
import { useAdminSections } from '../lib/useAdminSections'
import { AdminSectionRow } from './AdminSectionRow'
import { AdminSectionsHeader } from './AdminSectionsHeader'
import { AdminSectionsTopActions } from './AdminSectionsTopActions'
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
  const isWide = useIsWideLayout()
  const { topChromeScrollInset } = useScreenChromePadding()
  const router = useRouter()
  const { currentTheme } = useTheme()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const { isLoading, isRefreshing, isReordering, reload, reorder, sections } = useAdminSections()

  const openSection = (section: AdminSectionListItem) => {
    router.push({ params: { id: section.id }, pathname: '/admin/sections/[id]' })
  }

  const renderItem = ({ drag, isActive, item }: RenderItemParams<AdminSectionListItem>) => (
    <AdminSectionRow
      item={item}
      drag={drag}
      isActive={isActive}
      onPress={() => openSection(item)}
    />
  )

  return (
    <BlurBackdrop routeKey={BLUR_TARGET_ROUTES.adminSections}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: currentTheme.background,
            paddingTop: insets.top,
          },
        ]}
      >
        <PullToRefresh
          onRefresh={reload}
          refreshing={isRefreshing}
          topOffset={getRefreshTopOffset(isWide)}
        >
          <DraggableFlatList
            renderItem={renderItem}
            keyExtractor={item => item.id}
            data={isLoading ? [] : sections}
            containerStyle={styles.listContainer}
            onDragEnd={({ data }) => void reorder(data)}
            ListEmptyComponent={
              isLoading ? <SectionSkeletonList /> : <EmptyState message='Разделов пока нет' />
            }
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: tabBarHeight + INDENTS.low, paddingTop: topChromeScrollInset },
            ]}
            refreshControl={createRefreshControl(
              isRefreshing,
              reload,
              currentTheme.primary,
              topChromeScrollInset,
            )}
            ListFooterComponent={
              isReordering ? (
                <View style={styles.reordering}>
                  <AdminSectionRow.Skeleton />
                </View>
              ) : undefined
            }
            ListHeaderComponent={
              <AdminSectionsHeader
                showActions={!isWide}
                count={sections.length}
                onCreate={() => router.push(CREATE_ROUTE)}
              />
            }
          />
          <WideTopActions>
            <AdminSectionsTopActions onCreate={() => router.push(CREATE_ROUTE)} />
          </WideTopActions>
        </PullToRefresh>
      </View>
    </BlurBackdrop>
  )
}

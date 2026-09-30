import { useAction } from '@reatom/npm-react'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist'
import { SafeAreaView } from 'react-native-safe-area-context'
import { type APITypes } from 'shared/api'
import { showToast } from 'shared/model'
import { EmptyState } from 'shared/ui'
import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { COLORS, useTheme } from 'shared/ui/theme'
import { useAdminSectionDetail } from '../lib/useAdminSectionDetail'
import { SectionDetailHeader } from './SectionDetailHeader'
import { SectionDetailPlaylistRow } from './SectionDetailPlaylistRow'
import { SectionDetailStats } from './SectionDetailStats'
import { styles } from './styles'

const DELETE_SUCCESS_MESSAGE = 'Раздел удалён'
const DELETE_TITLE = 'Удалить раздел?'

export const AdminSectionDetailScreen = () => {
  const router = useRouter()
  const { currentTheme } = useTheme()
  const params = useLocalSearchParams<{ id: string }>()
  const id = params.id ?? ''
  const { isDeleting, isNotFound, playlists, remove, reorder, section } = useAdminSectionDetail(id)
  const showToastAction = useAction(showToast)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  // Memoized so expo-router's setOptions does not see a fresh object each render.
  const headerOptions = useMemo(() => ({ title: section?.title ?? '' }), [section?.title])

  const handleDelete = async () => {
    setIsDeleteOpen(false)
    if (await remove()) {
      showToastAction(DELETE_SUCCESS_MESSAGE)
      router.back()
    }
  }

  const renderItem = ({ drag, isActive, item }: RenderItemParams<APITypes.SectionPlaylist>) => (
    <SectionDetailPlaylistRow
      item={item}
      drag={drag}
      isActive={isActive}
      onPress={() => router.push({ params: { id: item.id }, pathname: '/admin/playlists/[id]' })}
    />
  )

  if (!section)
    return (
      <SafeAreaView
        edges={['bottom']}
        style={[styles.centered, { backgroundColor: currentTheme.background }]}
      >
        {isNotFound ? (
          <EmptyState message='Раздел не найден' />
        ) : (
          <ActivityIndicator size='large' color={COLORS.primary} />
        )}
      </SafeAreaView>
    )

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <Stack.Screen options={headerOptions} />
      <DraggableFlatList
        data={playlists}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        onDragEnd={({ data }) => void reorder(data)}
        ListEmptyComponent={<EmptyState message='Плейлистов пока нет' />}
        ListHeaderComponent={
          <View>
            <SectionDetailHeader
              title={section.title}
              description={section.description}
              onDelete={() => setIsDeleteOpen(true)}
              onEdit={() =>
                router.push({ params: { id: section.id }, pathname: '/admin/sections/[id]/edit' })
              }
            />
            <SectionDetailStats section={section} />
            <Text style={[styles.playlistsTitle, { color: currentTheme.text }]}>
              {`Плейлисты раздела (${playlists.length})`}
            </Text>
          </View>
        }
      />
      <ConfirmDialog
        title={DELETE_TITLE}
        visible={isDeleteOpen}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsDeleteOpen(false)}
        confirmText={isDeleting ? 'Удаление…' : 'Удалить'}
        message={`Раздел «${section.title}» будет удалён безвозвратно.`}
      />
    </SafeAreaView>
  )
}

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
import { useAdminPlaylistDetail } from '../lib/useAdminPlaylistDetail'
import { PlaylistDetailHeader } from './PlaylistDetailHeader'
import { PlaylistDetailSermonRow } from './PlaylistDetailSermonRow'
import { styles } from './styles'

const DELETE_SUCCESS_MESSAGE = 'Плейлист удалён'
const DELETE_TITLE = 'Удалить плейлист?'

export const AdminPlaylistDetailScreen = () => {
  const router = useRouter()
  const { currentTheme } = useTheme()
  const params = useLocalSearchParams<{ id: string }>()
  const id = params.id ?? ''
  const { isDeleting, isNotFound, playlist, remove, reorder, sermons } = useAdminPlaylistDetail(id)
  const showToastAction = useAction(showToast)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  // Memoized so expo-router's setOptions does not see a fresh object each render.
  const headerOptions = useMemo(() => ({ title: playlist?.title ?? '' }), [playlist?.title])

  const handleDelete = async () => {
    setIsDeleteOpen(false)
    if (await remove()) {
      showToastAction(DELETE_SUCCESS_MESSAGE)
      router.back()
    }
  }

  const renderItem = ({ drag, isActive, item }: RenderItemParams<APITypes.PlaylistSermon>) => (
    <PlaylistDetailSermonRow
      item={item}
      drag={drag}
      isActive={isActive}
      onPress={() => router.push({ params: { id: item.id }, pathname: '/admin/sermons/[id]' })}
    />
  )

  if (!playlist)
    return (
      <SafeAreaView
        edges={['bottom']}
        style={[styles.centered, { backgroundColor: currentTheme.background }]}
      >
        {isNotFound ? (
          <EmptyState message='Плейлист не найден' />
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
        data={sermons}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        onDragEnd={({ data }) => void reorder(data)}
        ListEmptyComponent={<EmptyState message='Проповедей пока нет' />}
        ListHeaderComponent={
          <View>
            <PlaylistDetailHeader
              playlist={playlist}
              sermonsCount={sermons.length}
              onDelete={() => setIsDeleteOpen(true)}
              onEdit={() =>
                router.push({ params: { id: playlist.id }, pathname: '/admin/playlists/[id]/edit' })
              }
            />
            <Text style={[styles.sermonsTitle, { color: currentTheme.text }]}>
              {`Проповеди плейлиста (${sermons.length})`}
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
        message={`Плейлист «${playlist.title}» будет удалён безвозвратно.`}
      />
    </SafeAreaView>
  )
}

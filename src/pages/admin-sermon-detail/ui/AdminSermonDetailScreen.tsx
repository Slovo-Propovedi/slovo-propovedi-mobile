import { useAction } from '@reatom/npm-react'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { showToast } from 'shared/model'
import { EmptyState } from 'shared/ui'
import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { COLORS, useTheme } from 'shared/ui/theme'
import { useAdminSermonDetail } from '../lib/useAdminSermonDetail'
import { SermonDetailHeader } from './SermonDetailHeader'
import { SermonMediaCard } from './SermonMediaCard'
import { SermonPlaylistRow } from './SermonPlaylistRow'
import { styles } from './styles'

const DELETE_SUCCESS_MESSAGE = 'Проповедь удалена'
const DELETE_TITLE = 'Удалить проповедь?'

export const AdminSermonDetailScreen = () => {
  const router = useRouter()
  const { currentTheme } = useTheme()
  const params = useLocalSearchParams<{ id: string }>()
  const id = params.id ?? ''
  const { isDeleting, isNotFound, remove, sermon } = useAdminSermonDetail(id)
  const showToastAction = useAction(showToast)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  // Memoized so expo-router's setOptions does not see a fresh object each render.
  const headerOptions = useMemo(() => ({ title: sermon?.title ?? '' }), [sermon?.title])

  const handleDelete = async () => {
    setIsDeleteOpen(false)
    if (await remove()) {
      showToastAction(DELETE_SUCCESS_MESSAGE)
      router.back()
    }
  }

  if (!sermon)
    return (
      <SafeAreaView
        edges={['bottom']}
        style={[styles.centered, { backgroundColor: currentTheme.background }]}
      >
        {isNotFound ? (
          <EmptyState message='Проповедь не найдена' />
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
      <ScrollView contentContainerStyle={styles.listContent}>
        <SermonDetailHeader
          sermon={sermon}
          onDelete={() => setIsDeleteOpen(true)}
          onEdit={() =>
            router.push({ params: { id: sermon.id }, pathname: '/admin/sermons/[id]/edit' })
          }
        />

        {sermon.description ? (
          <View style={[styles.card, { backgroundColor: currentTheme.surface }]}>
            <Text style={[styles.cardTitle, { color: currentTheme.text }]}>Описание</Text>
            <Text style={[styles.description, { color: currentTheme.textMuted }]}>
              {sermon.description}
            </Text>
          </View>
        ) : null}

        <SermonMediaCard
          audioUrl={sermon.audioUrl}
          youtubeUrl={sermon.youtubeUrl}
          textFileUrl={sermon.textFileUrl}
        />

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
          {`Плейлисты (${sermon.playlists.length})`}
        </Text>
        {sermon.playlists.length === 0 ? (
          <Text style={[styles.subtitle, { color: currentTheme.textMuted }]}>
            Проповедь не в плейлистах
          </Text>
        ) : (
          sermon.playlists.map(playlist => (
            <SermonPlaylistRow key={playlist.id} playlist={playlist} />
          ))
        )}
      </ScrollView>
      <ConfirmDialog
        title={DELETE_TITLE}
        visible={isDeleteOpen}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsDeleteOpen(false)}
        confirmText={isDeleting ? 'Удаление…' : 'Удалить'}
        message={`Проповедь «${sermon.title}» будет удалена безвозвратно.`}
      />
    </SafeAreaView>
  )
}

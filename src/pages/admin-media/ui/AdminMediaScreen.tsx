import { useAction, useAtom } from '@reatom/npm-react'
import { useState } from 'react'
import { ActivityIndicator, FlatList, Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { showToast } from 'shared/model'
import { EmptyState } from 'shared/ui'
import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { COLORS, INDENTS, PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { useAdminMedia } from '../lib/useAdminMedia'
import { usePickImage } from '../lib/usePickImage'
import { MediaTile } from './MediaTile'
import { OrphansSection } from './OrphansSection'
import { styles } from './styles'

const UPLOAD_LABEL = 'Загрузить обложку'
const UPLOAD_BUSY_LABEL = 'Загрузка'
const DELETE_TITLE = 'Удалить обложку?'
const DELETE_CONFIRM_TEXT = 'Удалить'
const DELETE_BUSY_TEXT = 'Удаление…'
const EMPTY_MESSAGE = 'Обложек пока нет'
const LOAD_ERROR = 'Не удалось загрузить файлы'

const uploadLabel = (isUploading: boolean, progress: number) =>
  isUploading ? `${UPLOAD_BUSY_LABEL} ${progress}%` : UPLOAD_LABEL

// Каталог медиа-библиотеки: сетка изображений с загрузкой и удалением, а ниже —
// блок осиротевших файлов. Удаление живого артворка сервер отклоняет (409).
export const AdminMediaScreen = () => {
  const { currentTheme } = useTheme()
  const showToastAction = useAction(showToast)
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const { files, isDeleting, isError, isLoading, isUploading, progress, remove, upload } =
    useAdminMedia()
  const [deleteTarget, setDeleteTarget] = useState<APITypes.FileMetadataDto | null>(null)

  const { pickImage } = usePickImage(
    asset => void upload(asset, () => undefined),
    message => showToastAction(message),
  )

  const handleDelete = async () => {
    const target = deleteTarget
    setDeleteTarget(null)
    if (target) await remove(target)
  }

  if (isLoading)
    return (
      <View style={[styles.centered, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size='large' color={COLORS.primary} />
      </View>
    )

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <FlatList
        data={files}
        numColumns={3}
        columnWrapperStyle={styles.grid}
        keyExtractor={item => item.fileName}
        ListFooterComponent={<OrphansSection />}
        renderItem={({ item }) => <MediaTile file={item} onDelete={() => setDeleteTarget(item)} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight + INDENTS.low },
        ]}
        ListEmptyComponent={
          isError ? (
            <Text style={[styles.error, { color: currentTheme.textMuted }]}>{LOAD_ERROR}</Text>
          ) : (
            <EmptyState message={EMPTY_MESSAGE} />
          )
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Медиафайлы</Text>
                <Text style={[styles.error, { color: currentTheme.textMuted }]}>
                  Библиотека изображений: загрузка и удаление. Обложки переиспользуются в проповедях
                  и плейлистах.
                </Text>
              </View>
              <TouchableItem
                disabled={isUploading}
                onPress={() => void pickImage()}
                style={[styles.primaryButton, { backgroundColor: currentTheme.primary }]}
              >
                {isUploading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>{uploadLabel(isUploading, progress)}</Text>
                )}
              </TouchableItem>
            </View>
            {isUploading ? (
              <View style={[styles.progressTrack, { backgroundColor: currentTheme.surface }]}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
            ) : null}
          </View>
        }
      />
      <ConfirmDialog
        title={DELETE_TITLE}
        visible={deleteTarget !== null}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
        confirmText={isDeleting ? DELETE_BUSY_TEXT : DELETE_CONFIRM_TEXT}
        message={`Файл «${deleteTarget?.fileName ?? ''}» будет удалён из хранилища без возможности восстановления.`}
      />
    </View>
  )
}

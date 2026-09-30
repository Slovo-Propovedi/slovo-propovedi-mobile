import { useAction, useAtom } from '@reatom/npm-react'
import { useState } from 'react'
import { FlatList, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { type APITypes } from 'shared/api'
import { SCREEN_WIDTH } from 'shared/config/screen-dimensions'
import { showToast } from 'shared/model'
import { AdminMediaGridSkeleton, EmptyState } from 'shared/ui'
import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { INDENTS, PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import { useAdminMedia } from '../lib/useAdminMedia'
import { usePickImage } from '../lib/usePickImage'
import { AdminMediaListHeader } from './AdminMediaListHeader'
import { MediaTile } from './MediaTile'
import { MediaViewerModal } from './MediaViewerModal'
import { styles } from './styles'

const DELETE_TITLE = 'Удалить обложку?'
const DELETE_CONFIRM_TEXT = 'Удалить'
const DELETE_BUSY_TEXT = 'Удаление…'
const EMPTY_MESSAGE = 'Обложек пока нет'
const LOAD_ERROR = 'Не удалось загрузить файлы'

// Целевой размер квадратной плитки: экран/плитка даёт 3 колонки на телефоне,
// больше — на планшете. Число колонок всегда ≥1, чтобы не делить на ноль.
const TARGET_TILE_SIZE = 120
const LIST_PADDING = INDENTS.medium * 2

const numColumnsFor = (width: number) =>
  Math.max(1, Math.floor((width - LIST_PADDING + INDENTS.low) / (TARGET_TILE_SIZE + INDENTS.low)))

// Каталог медиа-библиотеки: шапка с загрузкой, сетка квадратных изображений
// (тап — полноэкранный просмотр) и блок осиротевших файлов сверху. Удаление
// живого артворка сервер отклоняет (409).
export const AdminMediaScreen = () => {
  const { currentTheme } = useTheme()
  const showToastAction = useAction(showToast)
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const { files, isDeleting, isError, isLoading, isUploading, progress, remove, upload } =
    useAdminMedia()
  const [deleteTarget, setDeleteTarget] = useState<APITypes.FileMetadataDto | null>(null)
  const [viewerTarget, setViewerTarget] = useState<APITypes.FileMetadataDto | null>(null)

  const { pickImage } = usePickImage(
    asset => void upload(asset, () => undefined),
    message => showToastAction(message),
  )

  const numColumns = numColumnsFor(SCREEN_WIDTH)
  const tileSize = Math.floor(
    (SCREEN_WIDTH - LIST_PADDING - INDENTS.low * (numColumns - 1)) / numColumns,
  )

  const handleDelete = async () => {
    const target = deleteTarget
    setDeleteTarget(null)
    if (target) await remove(target)
  }

  if (isLoading)
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.container, { backgroundColor: currentTheme.background }]}
      >
        <View style={styles.listContent}>
          <AdminMediaGridSkeleton />
        </View>
      </SafeAreaView>
    )

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <FlatList
        data={files}
        numColumns={numColumns}
        key={`media-grid-${numColumns}`}
        columnWrapperStyle={styles.gridRow}
        keyExtractor={item => item.fileName}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight + INDENTS.low },
        ]}
        ListHeaderComponent={
          <AdminMediaListHeader
            progress={progress}
            isUploading={isUploading}
            onUpload={() => void pickImage()}
          />
        }
        renderItem={({ item }) => (
          <MediaTile
            file={item}
            size={tileSize}
            onPress={() => setViewerTarget(item)}
            onDelete={() => setDeleteTarget(item)}
          />
        )}
        ListEmptyComponent={
          isError ? (
            <Text style={[styles.error, { color: currentTheme.textMuted }]}>{LOAD_ERROR}</Text>
          ) : (
            <EmptyState message={EMPTY_MESSAGE} />
          )
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
      <MediaViewerModal
        visible={viewerTarget !== null}
        title={viewerTarget?.fileName ?? ''}
        fileUrl={viewerTarget?.fileUrl ?? ''}
        onClose={() => setViewerTarget(null)}
      />
    </SafeAreaView>
  )
}

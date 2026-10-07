import { useAction, useAtom } from '@reatom/npm-react'
import { useState } from 'react'
import { FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { type APITypes } from 'shared/api'
import { SCREEN_WIDTH } from 'shared/config/screen-dimensions'
import { predictedMimeGroups, useFileDrop } from 'shared/lib/file-drop'
import { showToast } from 'shared/model'
import { createRefreshControl, DropOverlay, PullToRefresh } from 'shared/ui'
import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { measureMediaGrid } from '../lib/mediaGrid'
import { useAdminMedia } from '../lib/useAdminMedia'
import { useDroppedImageUpload } from '../lib/useDroppedImageUpload'
import { usePickImage } from '../lib/usePickImage'
import { AdminMediaListHeader } from './AdminMediaListHeader'
import { MediaGridEmpty } from './MediaGridEmpty'
import { MediaTile } from './MediaTile'
import { MediaViewerModal } from './MediaViewerModal'
import { styles } from './styles'

const DELETE_TITLE = 'Удалить обложку?'
const DELETE_CONFIRM_TEXT = 'Удалить'
const DELETE_BUSY_TEXT = 'Удаление…'

// Каталог медиа-библиотеки: шапка с загрузкой, сетка квадратных изображений
// (тап — полноэкранный просмотр) и блок осиротевших файлов сверху. Удаление
// живого артворка сервер отклоняет (409).
export const AdminMediaScreen = () => {
  const { currentTheme } = useTheme()
  const showToastAction = useAction(showToast)
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const {
    files,
    isDeleting,
    isError,
    isLoading,
    isRefreshing,
    isUploading,
    progress,
    refresh,
    remove,
    upload,
  } = useAdminMedia()
  const [deleteTarget, setDeleteTarget] = useState<APITypes.FileMetadataDto | null>(null)
  const [viewerTarget, setViewerTarget] = useState<APITypes.FileMetadataDto | null>(null)

  const { pickImage } = usePickImage(
    asset => void upload(asset, () => undefined),
    message => showToastAction(message),
  )
  const { handleFiles } = useDroppedImageUpload(upload, isUploading)
  const { draggedMimeTypes, isDragActive } = useFileDrop(handleFiles)

  const { numColumns, tileSize } = measureMediaGrid(SCREEN_WIDTH)
  const dropEntries = [
    {
      active: predictedMimeGroups(draggedMimeTypes).has('image'),
      description: 'Изображение (JPEG, PNG, WebP) → загрузка в библиотеку обложек',
    },
  ]

  const handleDelete = async () => {
    setDeleteTarget(null)
    if (deleteTarget) await remove(deleteTarget)
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <PullToRefresh onRefresh={refresh} refreshing={isRefreshing}>
        <FlatList
          data={files}
          numColumns={numColumns}
          key={`media-grid-${numColumns}`}
          columnWrapperStyle={styles.gridRow}
          keyExtractor={item => item.fileName}
          refreshControl={createRefreshControl(isRefreshing, refresh, currentTheme.primary)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + INDENTS.low },
          ]}
          ListHeaderComponent={
            <AdminMediaListHeader
              progress={progress}
              isUploading={isUploading}
              onUpload={() => void pickImage()}
            />
          }
          ListEmptyComponent={
            <MediaGridEmpty
              isError={isError}
              tileSize={tileSize}
              isLoading={isLoading}
              numColumns={numColumns}
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
        />
      </PullToRefresh>
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
      <DropOverlay entries={dropEntries} visible={isDragActive} />
    </SafeAreaView>
  )
}

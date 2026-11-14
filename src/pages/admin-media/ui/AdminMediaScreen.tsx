import { useAction } from '@reatom/npm-react'
import { Stack } from 'expo-router'
import { useState } from 'react'
import { FlatList, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAdminListHeaderActions } from 'widgets/admin-list-header'
import { type APITypes } from 'shared/api'
import { SCREEN_WIDTH } from 'shared/config/screen-dimensions'
import { predictDropKinds, useFileDrop } from 'shared/lib/file-drop'
import { showToast } from 'shared/model'
import { createRefreshControl, DropOverlay, PullToRefresh } from 'shared/ui'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { measureMediaGrid } from '../lib/mediaGrid'
import { useAdminMedia } from '../lib/useAdminMedia'
import { useDroppedImageUpload } from '../lib/useDroppedImageUpload'
import { usePickImage } from '../lib/usePickImage'
import { AdminMediaListHeader } from './AdminMediaListHeader'
import { AdminMediaOverlays } from './AdminMediaOverlays'
import { MediaGridEmpty } from './MediaGridEmpty'
import { MediaTile } from './MediaTile'
import { styles } from './styles'

// Каталог медиа-библиотеки: шапка с загрузкой, сетка квадратных изображений
// (тап — полноэкранный просмотр) и блок осиротевших файлов сверху. Удаление
// живого артворка сервер отклоняет (409).
export const AdminMediaScreen = () => {
  const insets = useSafeAreaInsets()
  const { currentTheme } = useTheme()
  const showToastAction = useAction(showToast)
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
  const { draggedItems, isDragActive } = useFileDrop(handleFiles)

  const { numColumns, tileSize } = measureMediaGrid(SCREEN_WIDTH)
  const headerOptions = useAdminListHeaderActions({
    icon: 'cloud-upload-outline',
    isActionDisabled: isUploading,
    isRefreshing,
    label: 'Загрузить файл',
    onAction: () => void pickImage(),
    onRefresh: refresh,
  })
  const dropEntries = [
    {
      active: predictDropKinds(draggedItems).has('image'),
      description: 'Изображение (JPEG, PNG, WebP) → загрузка в библиотеку обложек',
    },
  ]

  const handleDelete = async () => {
    setDeleteTarget(null)
    if (deleteTarget) await remove(deleteTarget)
  }

  const containerStyle = { backgroundColor: currentTheme.background }

  return (
    <View style={[styles.container, containerStyle]}>
      <Stack.Screen options={headerOptions} />
      <PullToRefresh onRefresh={refresh} refreshing={isRefreshing}>
        <FlatList
          data={files}
          numColumns={numColumns}
          key={`media-grid-${numColumns}`}
          columnWrapperStyle={styles.gridRow}
          keyExtractor={item => item.fileName}
          refreshControl={createRefreshControl(isRefreshing, refresh, currentTheme.primary)}
          ListHeaderComponent={
            <AdminMediaListHeader progress={progress} isUploading={isUploading} />
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + INDENTS.low },
          ]}
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
      <AdminMediaOverlays
        isDeleting={isDeleting}
        deleteTarget={deleteTarget}
        viewerTarget={viewerTarget}
        onCloseViewer={() => setViewerTarget(null)}
        onConfirmDelete={() => void handleDelete()}
        onCancelDelete={() => setDeleteTarget(null)}
      />
      <DropOverlay entries={dropEntries} visible={isDragActive} />
    </View>
  )
}

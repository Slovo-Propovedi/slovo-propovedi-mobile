import { type APITypes } from 'shared/api'
import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { MediaViewerModal } from './MediaViewerModal'

const DELETE_TITLE = 'Удалить обложку?'
const DELETE_CONFIRM_TEXT = 'Удалить'
const DELETE_BUSY_TEXT = 'Удаление…'

/**
 * Delete confirmation and full-screen preview overlays of the media library.
 * Split from the grid screen so its file stays within the line budget.
 * @param root0 - Overlay state and handlers owned by the screen.
 * @param root0.deleteTarget - File awaiting delete confirmation, if any.
 * @param root0.isDeleting - Whether a delete request is in flight.
 * @param root0.onCancelDelete - Dismisses the delete dialog.
 * @param root0.onConfirmDelete - Confirms deletion of `deleteTarget`.
 * @param root0.onCloseViewer - Closes the full-screen preview.
 * @param root0.viewerTarget - File shown in the preview, if any.
 */
export const AdminMediaOverlays = ({
  deleteTarget,
  isDeleting,
  onCancelDelete,
  onCloseViewer,
  onConfirmDelete,
  viewerTarget,
}: {
  deleteTarget: APITypes.FileMetadataDto | null
  isDeleting: boolean
  onCancelDelete: () => void
  onCloseViewer: () => void
  onConfirmDelete: () => void
  viewerTarget: APITypes.FileMetadataDto | null
}) => (
  <>
    <ConfirmDialog
      title={DELETE_TITLE}
      onCancel={onCancelDelete}
      onConfirm={onConfirmDelete}
      visible={deleteTarget !== null}
      confirmText={isDeleting ? DELETE_BUSY_TEXT : DELETE_CONFIRM_TEXT}
      message={`Файл «${deleteTarget?.fileName ?? ''}» будет удалён из хранилища без возможности восстановления.`}
    />
    <MediaViewerModal
      onClose={onCloseViewer}
      visible={viewerTarget !== null}
      title={viewerTarget?.fileName ?? ''}
      fileUrl={viewerTarget?.fileUrl ?? ''}
    />
  </>
)

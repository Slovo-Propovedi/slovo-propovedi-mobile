import { useCtx } from '@reatom/npm-react'
import { useState } from 'react'
import { useContinuePlayback } from 'features/continue-playback'
import { currentPlaylistAtom, resetPlaybackAction } from 'entities/player'
import { myPlaylistsAtom, togglePlaylistSermon } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { COLORS } from 'shared/ui/theme'

interface MenuMembership {
  canRemove: boolean
  playlistId: null | string
}

const EMPTY_MEMBERSHIP: MenuMembership = { canRemove: false, playlistId: null }

const REMOVE_TITLE = 'Удалить из плейлиста?'
const REMOVE_MESSAGE =
  'Проповедь будет удалена из текущего плейлиста. Выберите, где продолжить прослушивание.'
const REMOVE_CONFIRM_TEXT = 'Удалить'
const CANCEL_TEXT = 'Отмена'

/**
 * «Удалить из текущего плейлиста и открыть в другом» для текущей проповеди:
 * снапшот членства на открытие меню, подтверждение удаления и предложение
 * продолжить прослушивание в другом плейлисте. Диалоги возвращаются
 * элементами и живут у вызывающего, поэтому переживают размонтирование меню.
 * @param audio - Текущая проповедь.
 */
export const usePlaylistRemoval = (audio: AudioPlayerData) => {
  const ctx = useCtx()
  const { dialog, offer } = useContinuePlayback()
  const [membership, setMembership] = useState<MenuMembership>(EMPTY_MEMBERSHIP)
  const [isRemoveDialogOpen, setRemoveDialogOpen] = useState(false)

  // Снапшот на клик открытия меню — без подписок и пересчёта на каждый рендер
  // (аналогично initialValues в useMembershipDraft).
  const snapshotMembership = () => {
    const playlist = ctx.get(currentPlaylistAtom)
    const isLocalPlaylist =
      playlist !== null && ctx.get(myPlaylistsAtom).some(item => item.id === playlist.id)
    const containsAudio =
      playlist !== null && playlist.sermons.some(sermon => sermon.id === audio.id)

    setMembership({ canRemove: isLocalPlaylist && containsAudio, playlistId: playlist?.id ?? null })
  }

  const requestRemove = () => setRemoveDialogOpen(true)

  const confirmRemove = () => {
    setRemoveDialogOpen(false)
    const { canRemove, playlistId } = membership
    setMembership(EMPTY_MEMBERSHIP)
    if (!canRemove || playlistId === null) return
    void togglePlaylistSermon(ctx, playlistId, audio, false, { suppressPlayerReset: true })
    void offer(audio, playlistId, () => void resetPlaybackAction(ctx))
  }

  const confirmDialog = (
    <ConfirmDialog
      title={REMOVE_TITLE}
      message={REMOVE_MESSAGE}
      cancelText={CANCEL_TEXT}
      onConfirm={confirmRemove}
      confirmColor={COLORS.error}
      visible={isRemoveDialogOpen}
      confirmText={REMOVE_CONFIRM_TEXT}
      onCancel={() => setRemoveDialogOpen(false)}
    />
  )

  return {
    canRemoveFromPlaylist: membership.canRemove,
    confirmDialog,
    dialog,
    requestRemove,
    snapshotMembership,
  }
}

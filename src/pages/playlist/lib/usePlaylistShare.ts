import { useAction, useAtom } from '@reatom/npm-react'
import * as Clipboard from 'expo-clipboard'
import { useCallback, useState } from 'react'
import { validate as uuidValidate } from 'uuid'
import { FAVORITES_PLAYLIST, myPlaylistsAtom, type PlaylistData } from 'entities/playlist'
import { shareLink } from 'shared/lib/shareLink'
import { showToast } from 'shared/model'
import { buildCustomPlaylistShareUrl } from './buildCustomPlaylistShareUrl'
import { buildPlaylistShareUrl } from './buildPlaylistShareUrl'

const COPIED_MESSAGE = 'Ссылка скопирована'
const SHARE_ERROR_MESSAGE = 'Не удалось поделиться. Попробуйте ещё раз'

export const usePlaylistShare = (playlist: PlaylistData, onCloseMenu: () => void) => {
  const [localPlaylists] = useAtom(myPlaylistsAtom)
  const showToastAction = useAction(showToast)
  const [isShareModalVisible, setShareModalVisible] = useState(false)

  const localPlaylist = localPlaylists.find(item => item.id === playlist.id)
  const isServerPlaylist = uuidValidate(playlist.id)
  const isLocalPlaylist = localPlaylist !== undefined && playlist.id !== FAVORITES_PLAYLIST.id
  const canShare = isServerPlaylist || isLocalPlaylist
  const shareUrl = canShare
    ? isLocalPlaylist
      ? buildCustomPlaylistShareUrl({
          sermonIds: localPlaylist?.sermonIds ?? [],
          title: playlist.title,
        })
      : buildPlaylistShareUrl(playlist.id)
    : null

  const openShareModal = useCallback(() => {
    if (!canShare) return
    onCloseMenu()
    setShareModalVisible(true)
  }, [canShare, onCloseMenu])

  const closeShareModal = useCallback(() => setShareModalVisible(false), [])

  const sendShareLink = async () => {
    if (shareUrl === null) return
    const result = await shareLink({ text: `${playlist.title} — ${shareUrl}`, url: shareUrl })
    if (result === 'copied') showToastAction(COPIED_MESSAGE)
    if (result === 'error') showToastAction(SHARE_ERROR_MESSAGE)
  }

  const copyShareLink = async () => {
    if (shareUrl === null) return
    try {
      await Clipboard.setStringAsync(`${playlist.title} — ${shareUrl}`)
      showToastAction(COPIED_MESSAGE)
    } catch (error) {
      console.warn('copyShareLink failed:', error)
      showToastAction(SHARE_ERROR_MESSAGE)
    }
  }

  return {
    canShare,
    closeShareModal,
    copyShareLink,
    isShareModalVisible,
    openShareModal,
    sendShareLink,
    shareUrl,
  }
}

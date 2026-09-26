import { useAction } from '@reatom/npm-react'
import { validate as uuidValidate } from 'uuid'
import { type PlaylistData, showToast } from 'shared/model'
import { buildPlaylistShareUrl } from './buildPlaylistShareUrl'
import { sharePlaylist } from './sharePlaylist'

const COPIED_MESSAGE = 'Ссылка скопирована'

export const usePlaylistShare = (playlist: PlaylistData, onCloseMenu: () => void) => {
  const canShare = uuidValidate(playlist.id)
  const showToastAction = useAction(showToast)

  const handleShare = async () => {
    if (!canShare) return
    const url = buildPlaylistShareUrl(playlist.id)
    const result = await sharePlaylist({ text: `${playlist.title} — ${url}`, url })
    if (result === 'copied') showToastAction(COPIED_MESSAGE)
    onCloseMenu()
  }

  return { canShare, handleShare }
}

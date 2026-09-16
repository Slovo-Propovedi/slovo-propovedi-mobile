import { type Ctx } from '@reatom/framework'
import { currentAudioAtom, currentPlaylistAtom } from 'entities/player'
import { type SermonCandidate } from '../model'

export const collectCurrentPlayerCandidates = (ctx: Ctx): SermonCandidate[] => {
  const playlist = ctx.get(currentPlaylistAtom)
  if (!playlist) return []

  const currentAudio = ctx.get(currentAudioAtom)
  const sermons =
    currentAudio && !playlist.sermons.some(sermon => sermon.id === currentAudio.id)
      ? [...playlist.sermons, currentAudio]
      : playlist.sermons

  return sermons.map(sermon => ({ playlist, sermon }))
}

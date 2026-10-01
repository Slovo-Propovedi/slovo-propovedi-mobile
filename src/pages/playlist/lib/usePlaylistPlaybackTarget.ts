import { useAtom } from '@reatom/npm-react'
import { useMemo } from 'react'
import {
  findLastListenedSermon,
  getEntrySermon,
  historyAtom,
  isEntryCompleted,
} from 'entities/listening-history'
import { type PlaylistData } from 'entities/playlist'
import { type SermonData } from 'entities/sermon'

const START_LABEL = 'Начать прослушивание плейлиста'
const CONTINUE_LABEL = 'Продолжить после последнего прослушанного'

const isPlayable = (sermon: SermonData) => Boolean(sermon.audioUrl)

const findFirstPlayable = (sermons: SermonData[]): null | SermonData =>
  sermons.find(isPlayable) ?? null

const findNextPlayable = (sermons: SermonData[], fromIndex: number): null | SermonData =>
  sermons.slice(fromIndex + 1).find(isPlayable) ??
  sermons.slice(0, fromIndex + 1).find(isPlayable) ??
  null

/**
 * Derives the smart play-all target from listening history: the label and the
 * sermon that pressing the play-all button must start.
 *
 * - No listened sermon in the playlist → start label, first playable sermon.
 * - Last listened sermon unfinished → continue label, that sermon (the player
 *   resumes from the stored position).
 * - Last listened sermon finished → continue label, the next playable sermon
 *   after it, wrapping around to the first playable when it was the last.
 * @param playlist - The playlist being displayed.
 */
export const usePlaylistPlaybackTarget = (
  playlist: PlaylistData,
): { label: string; target: null | SermonData } => {
  const [history] = useAtom(historyAtom)

  return useMemo(() => {
    const { sermons } = playlist
    const lastEntry = findLastListenedSermon(playlist, history)

    if (!lastEntry) return { label: START_LABEL, target: findFirstPlayable(sermons) }

    const lastSermonId = getEntrySermon(lastEntry)?.id
    const lastSermon = sermons.find(sermon => sermon.id === lastSermonId)

    if (!lastSermon) return { label: START_LABEL, target: findFirstPlayable(sermons) }

    if (!isEntryCompleted(lastEntry)) return { label: CONTINUE_LABEL, target: lastSermon }

    return {
      label: CONTINUE_LABEL,
      target: findNextPlayable(sermons, sermons.indexOf(lastSermon)),
    }
  }, [history, playlist])
}

import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback } from 'react'
import {
  recordPlaybackStartAction,
  recordSermonSwitchAction,
} from 'entities/listening-history/@x/player'
import { setPlayerFullscreen } from 'shared/model'
import { isOnlineAtom } from 'shared/model/network'
import { setCurrentAudioAction, setCurrentPlaylistAction } from '../model'
import { playNewSermonAsync, type PlayNewSermonProps } from './playNewSermonAsync'
import { usePlayer } from './usePlayer'
import { usePlayTapGuard } from './usePlayTapGuard'

export const usePlayNewSermon = () => {
  const { play, replaceAudio, seekTo, setLockScreenMetadata } = usePlayer()
  const [isOnline] = useAtom(isOnlineAtom)

  const setCurrentAudio = useAction(setCurrentAudioAction)
  const setCurrentPlaylist = useAction(setCurrentPlaylistAction)
  const openPlayerFullscreen = useAction(setPlayerFullscreen)
  const recordPlaybackStart = useAction(recordPlaybackStartAction)
  const recordSermonSwitch = useAction(recordSermonSwitchAction)

  const { clearSuppressionOnError, isRepeatTapSuppressed, markPlayFinished, markPlayStarted } =
    usePlayTapGuard()

  return useCallback(
    (props: PlayNewSermonProps) =>
      playNewSermonAsync(props, {
        clearSuppressionOnError,
        isOnline,
        isRepeatTapSuppressed,
        markPlayFinished,
        markPlayStarted,
        openPlayerFullscreen,
        play,
        recordPlaybackStart,
        recordSermonSwitch,
        replaceAudio,
        seekTo,
        setCurrentAudio,
        setCurrentPlaylist,
        setLockScreenMetadata,
      }),
    [
      clearSuppressionOnError,
      isOnline,
      isRepeatTapSuppressed,
      markPlayFinished,
      markPlayStarted,
      openPlayerFullscreen,
      play,
      recordPlaybackStart,
      recordSermonSwitch,
      replaceAudio,
      seekTo,
      setCurrentAudio,
      setCurrentPlaylist,
      setLockScreenMetadata,
    ],
  )
}

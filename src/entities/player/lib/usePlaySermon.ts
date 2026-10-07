import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback } from 'react'
import {
  recordPlaybackStartAction,
  recordSermonSwitchAction,
} from 'entities/listening-history/@x/player'
import { isOnlineAtom } from 'shared/model/network'
import { setCurrentAudioAction, setCurrentPlaylistAction } from '../model'
import { playNewSermonAsync } from './playNewSermonAsync'
import { type PlayNewSermonProps } from './playNewSermonTypes'
import { usePlayer } from './usePlayer'
import { usePlayTapGuard } from './usePlayTapGuard'

export const usePlayNewSermon = () => {
  const { play, replaceAudio, resumeAfterPause, seekTo, setLockScreenMetadata } = usePlayer()
  const [isOnline] = useAtom(isOnlineAtom)

  const setCurrentAudio = useAction(setCurrentAudioAction)
  const setCurrentPlaylist = useAction(setCurrentPlaylistAction)
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
        play,
        recordPlaybackStart,
        recordSermonSwitch,
        replaceAudio,
        resumeAfterPause,
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
      play,
      recordPlaybackStart,
      recordSermonSwitch,
      replaceAudio,
      resumeAfterPause,
      seekTo,
      setCurrentAudio,
      setCurrentPlaylist,
      setLockScreenMetadata,
    ],
  )
}

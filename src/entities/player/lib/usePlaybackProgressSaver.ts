import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { flushHistoryProgressAction } from 'entities/listening-history/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  durationAtom,
  isPlayingAtom,
  positionAtom,
} from '../model'
import { savePlaybackProgress } from './playbackProgress'

const AUTO_SAVE_INTERVAL_MS = 10_000

export const usePlaybackProgressSaver = () => {
  const positionRef = useRef(0)
  const durationRef = useRef(0)
  const isPlayingRef = useRef(false)
  const currentAudioRef = useRef<AudioPlayerData | null>(null)
  const playlistRef = useRef<null | PlaylistData>(null)
  const previousAudioIdRef = useRef<string | undefined>(undefined)
  const skipNextTickRef = useRef(false)

  useEffect(() => {
    const unsubPosition = ctx.subscribe(positionAtom, v => {
      positionRef.current = v
    })
    const unsubDuration = ctx.subscribe(durationAtom, v => {
      durationRef.current = v
    })
    const unsubIsPlaying = ctx.subscribe(isPlayingAtom, v => {
      isPlayingRef.current = v
    })
    const unsubAudio = ctx.subscribe(currentAudioAtom, v => {
      const prevId = previousAudioIdRef.current
      const nextId = v?.id
      if (prevId !== undefined && nextId !== prevId) skipNextTickRef.current = true
      previousAudioIdRef.current = nextId
      currentAudioRef.current = v
    })
    const unsubPlaylist = ctx.subscribe(currentPlaylistAtom, v => {
      playlistRef.current = v
    })

    const flushNow = () => {
      if (!isPlayingRef.current) return

      if (skipNextTickRef.current) {
        skipNextTickRef.current = false
        return
      }

      const position = positionRef.current
      const audio = currentAudioRef.current
      if (position <= 0 || !audio) return

      void savePlaybackProgress(ctx, {
        durationMs: durationRef.current,
        positionMs: position,
        sermonId: audio.id,
      })
      void flushHistoryProgressAction(ctx, {
        durationMs: durationRef.current,
        playlist: playlistRef.current ?? undefined,
        positionMs: position,
        sermon: audio,
      })
    }

    const interval = setInterval(flushNow, AUTO_SAVE_INTERVAL_MS)

    const subAppState = AppState.addEventListener('change', nextState => {
      if (nextState === 'background') flushNow()
    })

    return () => {
      clearInterval(interval)
      subAppState.remove()
      unsubPosition()
      unsubDuration()
      unsubIsPlaying()
      unsubAudio()
      unsubPlaylist()
    }
  }, [])
}

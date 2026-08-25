import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { writeLiveProgressSnapshot } from 'entities/listening-history/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { currentAudioAtom, durationAtom, isPlayingAtom, positionAtom } from '../model'
import { savePlaybackProgress } from './playbackProgress'

export const usePlaybackProgressSaver = () => {
  const positionRef = useRef(0)
  const durationRef = useRef(0)
  const isPlayingRef = useRef(false)
  const currentAudioRef = useRef<{ id: string } | null>(null)
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

    const flushNow = () => {
      if (!isPlayingRef.current) return

      if (skipNextTickRef.current) {
        skipNextTickRef.current = false
        return
      }

      const position = positionRef.current
      const sermonId = currentAudioRef.current?.id
      if (position <= 0 || !sermonId) return

      void savePlaybackProgress(ctx, {
        durationMs: durationRef.current,
        positionMs: position,
        sermonId,
      })
      writeLiveProgressSnapshot({
        durationMs: durationRef.current,
        positionMs: position,
        sermonId,
      })
    }

    const interval = setInterval(flushNow, 5000)

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
    }
  }, [])
}

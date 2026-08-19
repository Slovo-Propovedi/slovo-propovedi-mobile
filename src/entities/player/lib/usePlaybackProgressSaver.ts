import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useRef } from 'react'
import { updateHistoryProgressAction } from 'entities/listening-history'
import { CURRENT_SOUND_POSITION } from 'shared/config'
import { ctx } from 'shared/lib/reatom-ctx'
import { currentAudioAtom, durationAtom, isPlayingAtom, positionAtom } from '../model'

export const usePlaybackProgressSaver = () => {
  const positionRef = useRef(0)
  const durationRef = useRef(0)
  const isPlayingRef = useRef(false)
  const currentAudioRef = useRef<{ id: string } | null>(null)

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
      currentAudioRef.current = v
    })

    const savePosition = () => {
      const position = positionRef.current
      const sermonId = currentAudioRef.current?.id
      if (position <= 0 || !sermonId) return

      void AsyncStorage.setItem(CURRENT_SOUND_POSITION, String(position))
      void updateHistoryProgressAction(ctx, {
        durationMs: durationRef.current,
        positionMs: position,
        sermonId,
      })
    }

    const interval = setInterval(savePosition, 5000)

    return () => {
      clearInterval(interval)
      unsubPosition()
      unsubDuration()
      unsubIsPlaying()
      unsubAudio()
    }
  }, [])
}

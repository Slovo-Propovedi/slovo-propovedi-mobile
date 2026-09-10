import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import { isOnlineAtom } from 'shared/model/network'
import type { LockScreenMetadata } from './types'
import { currentAudioAtom } from '../../model'
import { guardOfflinePlayback } from '../playOfflineGuard'
import { type GetAudio, type MediaSessionPlayer, registerSeekHandlers } from './webMediaSessionSeek'
import { updatePlaybackState, updatePositionState } from './webMediaSessionState'

export interface WebMediaSession {
  clear: () => void
  setMetadata: (metadata: LockScreenMetadata) => void
  updatePlaybackState: () => void
  updatePositionState: () => void
}

const NOOP_MEDIA_SESSION: WebMediaSession = {
  clear: () => {},
  setMetadata: () => {},
  updatePlaybackState: () => {},
  updatePositionState: () => {},
}

const createSetHandler =
  (ns: MediaSession | undefined) =>
  (action: MediaSessionAction, handler: MediaSessionActionHandler | null): void => {
    try {
      ns?.setActionHandler(action, handler)
    } catch {
      // Unsupported action in this browser — ignore silently.
    }
  }

const applyMetadata = (metadata: LockScreenMetadata | null): void => {
  if (!metadata) {
    navigator.mediaSession.metadata = null
    return
  }

  const artwork = metadata.artworkUrl ? [{ src: metadata.artworkUrl }] : []
  navigator.mediaSession.metadata = new MediaMetadata({
    album: metadata.albumTitle ?? '',
    artist: metadata.artist ?? '',
    artwork,
    title: metadata.title ?? '',
  })
}

export const createWebMediaSession = (
  player: MediaSessionPlayer,
  getAudio: GetAudio,
): WebMediaSession => {
  if (!navigator.mediaSession) return NOOP_MEDIA_SESSION

  const ns = navigator.mediaSession
  const setHandler = createSetHandler(ns)

  const clear = (): void => {
    ns.metadata = null
    ns.playbackState = 'none'

    for (const action of [
      'play',
      'pause',
      'seekto',
      'seekbackward',
      'seekforward',
      'previoustrack',
      'nexttrack',
    ] as const)
      setHandler(action, null)

    try {
      ns.setPositionState()
    } catch {
      /* ignore */
    }
  }

  const registerActionHandlers = (): void => {
    setHandler('play', () => {
      const audio = getAudio()
      if (!audio || !audio.paused) {
        player.play()
        return
      }
      const audioUrl = ctx.get(currentAudioAtom)?.audioUrl
      if (!audioUrl) return
      void guardOfflinePlayback(audioUrl, ctx.get(isOnlineAtom))
        .then(blocked => {
          if (!blocked) player.play()
        })
        .catch(() => {
          /* guard failure is non-fatal — media-session play is skipped */
        })
    })

    setHandler('pause', () => {
      player.pause()
    })

    registerSeekHandlers(setHandler, player, getAudio, updatePositionState)

    setHandler('nexttrack', null)
    setHandler('previoustrack', null)
  }

  const setMetadata = (metadata: LockScreenMetadata): void => {
    try {
      applyMetadata(metadata)
      registerActionHandlers()
      updatePlaybackState(getAudio())
      updatePositionState(getAudio())
    } catch (error) {
      console.error('[WebMediaSession] setMetadata failed:', error)
      reportError(error, 'Не удалось обновить данные плеера на экране блокировки')
    }
  }

  return {
    clear,
    setMetadata,
    updatePlaybackState: () => updatePlaybackState(getAudio()),
    updatePositionState: () => updatePositionState(getAudio()),
  }
}

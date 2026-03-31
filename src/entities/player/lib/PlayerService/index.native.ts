/* eslint-disable max-lines -- FIXME: refactor */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio'
import {
  CURRENT_AUDIO,
  CURRENT_PLAYLIST,
  CURRENT_REPEAT_MODE,
  CURRENT_SOUND_DURATION,
  CURRENT_SOUND_POSITION,
} from 'shared/config'
import { audioCacheService } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { parseJsonWithSchema, type PlaylistData, playlistDataSchema } from 'shared/model'
import {
  RepeatMode,
  repeatModeSchema,
  setCurrentAudioAction,
  setDurationAction,
  setIsBufferingAction,
  setIsPlayingAction,
  setPositionAction,
  setVolumeAction,
} from '../../model'
import { type AudioPlayerData, audioPlayerDataSchema } from '../../ui/PlayerControls.types'
import {
  setDownloadingUrlAction,
  setDownloadProgressAction,
  setIsDownloadingAction,
} from '../download-model'

interface LockScreenMetadata {
  albumTitle?: string
  artist?: string
  artworkUrl?: string
  title: string
}

class PlayerService {
  private configureAudioMode = async () => {
    if (this.audioModeConfigured) return
    try {
      await setAudioModeAsync({
        interruptionMode: 'doNotMix',
        playsInSilentMode: true,
        shouldPlayInBackground: true,
      })
      this.audioModeConfigured = true
    } catch (error) {
      console.warn('[PlayerService] configureAudioMode: Failed (app may be backgrounded):', error)
    }
  }

  public setLockScreenMetadata = (metadata: LockScreenMetadata) => {
    if (this.playerInstance?.isLoaded)
      this.playerInstance.setActiveForLockScreen(true, metadata, {
        showSeekBackward: true,
        showSeekForward: true,
      })
  }

  public clearLockScreenControls = () => {
    if (this.playerInstance?.isLoaded) this.playerInstance.setActiveForLockScreen(false)
  }

  public play = async () => {
    await this.configureAudioMode()

    if (this.playerInstance?.isLoaded) this.playerInstance.play()
  }

  public pause = async () => {
    if (this.playerInstance) {
      this.playerInstance.pause()
      await AsyncStorage.setItem(
        CURRENT_SOUND_POSITION,
        String(Math.floor(this.playerInstance.currentTime * 1000)),
      )
      void setIsPlayingAction(ctx, false)
    }
  }

  public stop = async () => {
    if (this.playerInstance) {
      this.playerInstance.pause()
      await this.playerInstance.seekTo(0)
      void setIsPlayingAction(ctx, false)
    }
  }

  public seekTo = async (newPositionMs: number) => {
    if (!this.playerInstance) return

    const clampedPosition = Math.max(0, newPositionMs)
    void setPositionAction(ctx, clampedPosition)
    await this.playerInstance.seekTo(clampedPosition / 1000)
  }

  public getVolume = () => this.volume

  public getStatus = async () => {
    if (!this.playerInstance?.isLoaded) return { duration: 0, isPlaying: false, position: 0 }
    return {
      duration: Math.floor(this.playerInstance.duration * 1000),
      isPlaying: this.playerInstance.playing,
      position: Math.floor(this.playerInstance.currentTime * 1000),
    }
  }

  public setVolume = async (newVolume: number) => {
    this.volume = Math.max(0, Math.min(1, newVolume))
    if (this.playerInstance?.isLoaded) this.playerInstance.volume = this.volume
    void setVolumeAction(ctx, this.volume)
  }

  public loadAudio = async (audioUrl: string, initialPositionMs = 0) => {
    void setIsBufferingAction(ctx, true)
    void setPositionAction(ctx, 0)
    this.trackEndHandled = false

    await this.configureAudioMode()

    if (this.playerInstance) {
      this.playerInstance.pause()
      this.playerInstance = null
    }

    // Check if audio is already cached
    let playUrl = audioUrl
    try {
      const cachedUri = await audioCacheService.getCachedUri(audioUrl)
      if (cachedUri) playUrl = cachedUri
      else this.startBackgroundCaching(audioUrl)
    } catch (error) {
      console.error('[PlayerService] loadAudio - Error checking cache:', error)
    }

    const player = createAudioPlayer({ uri: playUrl }, { downloadFirst: true })
    this.playerInstance = player

    return new Promise<AudioPlayer | null>(resolve => {
      const maxWait = 30000
      const checkInterval = 100
      let elapsed = 0

      const checkLoaded = setInterval(() => {
        elapsed += checkInterval

        if (player.isLoaded) {
          clearInterval(checkLoaded)

          const dur = Math.floor(player.duration * 1000)
          void setDurationAction(ctx, dur)
          void AsyncStorage.setItem(CURRENT_SOUND_DURATION, String(dur))
          void setIsBufferingAction(ctx, false)

          void player.seekTo(initialPositionMs / 1000)
          void setPositionAction(ctx, initialPositionMs)

          this.setupTrackEndListener()
          this.setupPlaybackStatusListener()
          try {
            resolve(player)
          } catch (error) {
            console.error('[PlayerService] loadAudio: ERROR - resolve() threw exception:', error)
            throw error
          }
        } else if (elapsed >= maxWait) {
          clearInterval(checkLoaded)
          void setIsBufferingAction(ctx, false)
          try {
            resolve(null)
          } catch (error) {
            console.error(
              '[PlayerService] loadAudio: ERROR - resolve(null) threw exception:',
              error,
            )
            throw error
          }
        }
      }, checkInterval)
    }).catch(error => {
      console.error('[PlayerService] loadAudio: Promise rejected with error:', error)
      void setIsBufferingAction(ctx, false)
      return null
    })
  }

  public replaceAudio = async (audioUrl: string, initialPositionMs = 0) => {
    void setIsBufferingAction(ctx, true)
    this.trackEndHandled = false

    await this.configureAudioMode()

    if (!this.playerInstance) return this.loadAudio(audioUrl, initialPositionMs)

    // Check if audio is already cached
    let playUrl = audioUrl
    try {
      const cachedUri = await audioCacheService.getCachedUri(audioUrl)
      if (cachedUri) playUrl = cachedUri
      else this.startBackgroundCaching(audioUrl)
    } catch (error) {
      console.error('[PlayerService] replaceAudio - Error checking cache:', error)
    }

    this.playerInstance.replace(playUrl)
    return this.playerInstance
  }

  public unload = async () => {
    this.clearLockScreenControls()

    if (this.playbackStatusSubscription) {
      this.playbackStatusSubscription.remove()
      this.playbackStatusSubscription = null
    }

    if (this.trackEndSubscription) {
      this.trackEndSubscription.remove()
      this.trackEndSubscription = null
    }

    if (this.playerInstance) {
      this.playerInstance.pause()
      this.playerInstance = null
    }
  }

  private setupTrackEndListener = () => {
    if (!this.playerInstance) return

    this.trackEndSubscription = this.playerInstance.addListener('playbackStatusUpdate', status => {
      if (status.didJustFinish && !this.trackEndHandled) {
        this.trackEndHandled = true
        void this.handleTrackEndAutoAdvance()
      }
    })
  }

  private setupPlaybackStatusListener = () => {
    if (!this.playerInstance) return

    this.playbackStatusSubscription = this.playerInstance.addListener(
      'playbackStatusUpdate',
      status => {
        void setIsPlayingAction(ctx, status.playing)

        const positionMs = Math.floor(status.currentTime * 1000)
        void setPositionAction(ctx, positionMs)

        const durationMs = Math.floor(status.duration * 1000)
        void setDurationAction(ctx, durationMs)

        void setIsBufferingAction(ctx, status.isBuffering)
      },
    )
  }

  private handleTrackEndAutoAdvance = async () => {
    const [[, storedCurrentAudio], [, storedCurrentPlaylist], [, storedRepeatMode]] =
      await AsyncStorage.multiGet([CURRENT_AUDIO, CURRENT_PLAYLIST, CURRENT_REPEAT_MODE])

    const { data: repeatMode = RepeatMode.Off } = repeatModeSchema.safeParse(storedRepeatMode)
    const currentAudio = parseJsonWithSchema(audioPlayerDataSchema)(storedCurrentAudio)
    const currentPlaylist = parseJsonWithSchema(playlistDataSchema)(storedCurrentPlaylist)

    if (!currentPlaylist) return

    const currentIndex = currentPlaylist.list.findIndex(t => t.id === currentAudio?.id)
    const isLastTrack = currentIndex === currentPlaylist.list.length - 1

    // Repeat one track
    if (repeatMode === RepeatMode.Track) {
      await this.seekTo(0)
      await this.play()
      return
    }

    // Last track - handle repeat or stop
    if (isLastTrack) {
      if (repeatMode === RepeatMode.Queue) {
        await this.playFirstTrackInQueue(currentPlaylist)
        return
      }
      await this.pause()
      return
    }

    // Not last track - play next
    const nextTrack = currentPlaylist.list[currentIndex + 1]

    if (!nextTrack?.audioUrl) return
    const audioUrl = nextTrack.audioUrl

    await this.playNextTrack({ ...nextTrack, audioUrl }, currentPlaylist, audioUrl)
  }

  private playFirstTrackInQueue = async (currentPlaylist: PlaylistData) => {
    const firstTrack = currentPlaylist.list[0]

    if (!firstTrack?.audioUrl) return
    const audioUrl = firstTrack.audioUrl

    const newAudio: AudioPlayerData = { ...firstTrack, audioUrl }

    await setCurrentAudioAction(ctx, newAudio)
    await this.replaceAudio(newAudio.audioUrl)
    this.setLockScreenMetadata({
      albumTitle: currentPlaylist.title,
      artist: newAudio.artist,
      artworkUrl: newAudio.artwork,
      title: newAudio.title,
    })

    try {
      await this.play()
    } catch (error) {
      if (error instanceof Error && error.message.includes('activity is no longer available'))
        console.warn('[PlayerService] Ignoring AppState-related error:', error.message)
      else throw error
    }
  }

  private playNextTrack = async (
    nextTrack: AudioPlayerData,
    currentPlaylist: PlaylistData,
    audioUrl: string,
  ) => {
    const newAudio: AudioPlayerData = {
      ...nextTrack,
      audioUrl,
    }
    await setCurrentAudioAction(ctx, newAudio)
    await this.replaceAudio(audioUrl)
    this.setLockScreenMetadata({
      albumTitle: currentPlaylist.title,
      artist: newAudio.artist,
      artworkUrl: newAudio.artwork,
      title: newAudio.title,
    })

    try {
      await this.play()
    } catch (error) {
      if (error instanceof Error && error.message.includes('activity is no longer available'))
        console.warn('[PlayerService] Ignoring AppState-related error:', error.message)
      else throw error
    }
  }

  private startBackgroundCaching = (audioUrl: string) => {
    setIsDownloadingAction(ctx, true)
    setDownloadingUrlAction(ctx, audioUrl)
    setDownloadProgressAction(ctx, 0)

    audioCacheService
      .cacheAudio(audioUrl, progress => {
        setDownloadProgressAction(ctx, progress)
      })
      .then(() => {
        setDownloadProgressAction(ctx, 1)
      })
      .catch(error => {
        console.error('[PlayerService] Background caching failed:', error)
      })
      .finally(() => {
        setIsDownloadingAction(ctx, false)
        setDownloadingUrlAction(ctx, null)
      })
  }

  private audioModeConfigured = false
  private playerInstance: AudioPlayer | null = null
  private playbackStatusSubscription: { remove: () => void } | null = null
  private trackEndSubscription: { remove: () => void } | null = null
  private trackEndHandled = false
  private volume = 1
}

export const playerService = new PlayerService()

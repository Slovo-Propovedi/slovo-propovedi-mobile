import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback, useState } from 'react'
import { getResumePosition, historyAtom } from 'entities/listening-history/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { currentAudioAtom, isPlayingAtom, setCurrentPlaylistAction } from '../model'
import { savePlaybackProgress } from './playbackProgress'
import { usePlayer } from './usePlayer'

interface UseQueueManagementReturn {
  activeTrack: AudioPlayerData | null
  addToQueue: (track: AudioPlayerData) => Promise<void>
  isPlaying: boolean
  playNext: () => Promise<void>
  playPlaylist: (tracks: AudioPlayerData[], startIndex?: number) => Promise<void>
  playPrevious: () => Promise<void>
  playTrack: (track: AudioPlayerData, queue: AudioPlayerData[], index: number) => Promise<void>
  queue: AudioPlayerData[]
  shufflePlaylist: (tracks: AudioPlayerData[]) => Promise<void>
}

export const useQueueManagement = (): UseQueueManagementReturn => {
  const [currentAudio] = useAtom(currentAudioAtom)
  const [isPlaying] = useAtom(isPlayingAtom)
  const [queue, setQueue] = useState<AudioPlayerData[]>([])
  const setCurrentPlaylist = useAction(setCurrentPlaylistAction)

  const { loadAudio, play, replaceAudio } = usePlayer()

  const createDefaultPlaylist = (tracks: AudioPlayerData[]): PlaylistData => {
    const firstTrack = tracks[0]
    if (!firstTrack) return { artwork: null, id: 'default', sermons: [], title: 'Слово.Проповеди' }

    return {
      artwork: firstTrack.artwork,
      id: firstTrack.id,
      sermons: tracks,
      title: firstTrack.title,
    }
  }

  const playPlaylist = useCallback(
    async (tracks: AudioPlayerData[], startIndex = 0) => {
      setQueue(tracks)
      const playlist = createDefaultPlaylist(tracks)
      await setCurrentPlaylist(playlist)
      if (tracks[startIndex]) {
        await loadAudio(tracks[startIndex].audioUrl)
        await play()
      }
    },
    [loadAudio, play, setCurrentPlaylist],
  )

  const playTrack = useCallback(
    async (_track: AudioPlayerData, queueData: AudioPlayerData[], index: number) => {
      setQueue(queueData)
      const playlist = createDefaultPlaylist(queueData)
      await setCurrentPlaylist(playlist)
      if (queueData[index]) {
        const targetSermonId = queueData[index].id
        const history = ctx.get(historyAtom)
        const resumeMs = getResumePosition(history, targetSermonId)
        void savePlaybackProgress(ctx, { positionMs: resumeMs, sermonId: targetSermonId })
        await replaceAudio(queueData[index].audioUrl, resumeMs)
        await play()
      }
    },
    [play, replaceAudio, setCurrentPlaylist],
  )

  const shufflePlaylist = useCallback(
    async (tracks: AudioPlayerData[]) => {
      const shuffledTracks = [...tracks].sort(() => Math.random() - 0.5)
      setQueue(shuffledTracks)
      const playlist = createDefaultPlaylist(shuffledTracks)
      await setCurrentPlaylist(playlist)
      if (shuffledTracks[0]) {
        const targetSermonId = shuffledTracks[0].id
        const history = ctx.get(historyAtom)
        const resumeMs = getResumePosition(history, targetSermonId)
        void savePlaybackProgress(ctx, { positionMs: resumeMs, sermonId: targetSermonId })
        await replaceAudio(shuffledTracks[0].audioUrl, resumeMs)
        await play()
      }
    },
    [play, replaceAudio, setCurrentPlaylist],
  )

  const addToQueue = useCallback(async (track: AudioPlayerData) => {
    setQueue(prev => [...prev, track])
  }, [])

  const playNext = useCallback(async () => {
    const currentIndex = queue.findIndex(t => t.id === currentAudio?.id)
    if (currentIndex >= 0 && currentIndex < queue.length - 1) {
      const nextTrack = queue[currentIndex + 1]
      const history = ctx.get(historyAtom)
      const resumeMs = getResumePosition(history, nextTrack.id)
      void savePlaybackProgress(ctx, { positionMs: resumeMs, sermonId: nextTrack.id })
      await replaceAudio(nextTrack.audioUrl, resumeMs)
      await play()
    }
  }, [currentAudio, queue, play, replaceAudio])

  const playPrevious = useCallback(async () => {
    const currentIndex = queue.findIndex(t => t.id === currentAudio?.id)
    if (currentIndex > 0) {
      const prevTrack = queue[currentIndex - 1]
      const history = ctx.get(historyAtom)
      const resumeMs = getResumePosition(history, prevTrack.id)
      void savePlaybackProgress(ctx, { positionMs: resumeMs, sermonId: prevTrack.id })
      await replaceAudio(prevTrack.audioUrl, resumeMs)
      await play()
    }
  }, [currentAudio, queue, play, replaceAudio])

  return {
    activeTrack: currentAudio,
    addToQueue,
    isPlaying,
    playNext,
    playPlaylist,
    playPrevious,
    playTrack,
    queue,
    shufflePlaylist,
  }
}

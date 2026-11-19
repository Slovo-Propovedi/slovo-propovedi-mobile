import { renderHook } from '@testing-library/react-native'
import { type PlaylistData } from 'entities/playlist/@x/player'
import { type AudioPlayerData } from 'entities/sermon/@x/player'
import { usePlayerTrackState } from './usePlayerTrackState'

const playlist: PlaylistData = {
  artwork: null,
  id: 'playlist-1',
  sermons: [
    { artist: 'Author A', artwork: null, id: 'sermon-a', title: 'Sermon A' },
    { artist: 'Author B', artwork: null, id: 'sermon-b', title: 'Sermon B' },
  ],
  title: 'Test Playlist',
}

const currentAudio: AudioPlayerData = {
  artist: 'Author B',
  artwork: null,
  audioUrl: 'https://example.com/b.mp3',
  id: 'sermon-b',
  title: 'Sermon B',
}

describe('usePlayerTrackState', () => {
  test('invalidates the playlist when the current track is not in it', async () => {
    const { result } = await renderHook(() =>
      usePlayerTrackState({
        currentAudio: { ...currentAudio, id: 'not-in-playlist' },
        currentPlaylist: playlist,
      }),
    )

    expect(result.current.index).toBe(-1)
    expect(result.current.hasValidPlaylist).toBe(false)
  })

  test('keeps the playlist valid when the current track is in it', async () => {
    const { result } = await renderHook(() =>
      usePlayerTrackState({ currentAudio, currentPlaylist: playlist }),
    )

    expect(result.current.index).toBe(1)
    expect(result.current.hasValidPlaylist).toBe(true)
  })
})

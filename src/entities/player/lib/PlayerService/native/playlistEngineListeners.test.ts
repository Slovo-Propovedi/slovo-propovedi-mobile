import { type AudioPlaylist } from 'expo-audio'
import { attachPlaylistListeners } from './playlistEngineListeners'

type PayloadHandler = (payload: Record<string, unknown>) => void

const createPlaylist = () => {
  const listeners: Record<string, PayloadHandler | undefined> = {}
  const playlist = {
    addListener: (event: string, handler: PayloadHandler) => {
      listeners[event] = handler
      return { remove: jest.fn() }
    },
  } as unknown as AudioPlaylist

  return { listeners, playlist }
}

describe('attachPlaylistListeners', () => {
  test('publishes the auto-advance counter from status and trackChanged payloads', () => {
    const { listeners, playlist } = createPlaylist()
    const onAutoAdvanceCount = jest.fn()
    const onStatus = jest.fn()
    const onTrackChanged = jest.fn()
    const onSourceChange = jest.fn()
    const snapshots = new Map()

    attachPlaylistListeners(
      playlist,
      { onStatus, onTrackChanged },
      snapshots,
      onSourceChange,
      ['source-0', 'source-1'],
      onAutoAdvanceCount,
    )

    listeners.playlistStatusUpdate?.({
      autoAdvanceCount: 3,
      currentIndex: 0,
      currentTime: 10,
      duration: 100,
    })
    listeners.trackChanged?.({ autoAdvanceCount: 5, currentIndex: 1, previousIndex: 0 })

    expect(onAutoAdvanceCount).toHaveBeenNthCalledWith(1, 3)
    expect(onAutoAdvanceCount).toHaveBeenNthCalledWith(2, 5)
    expect(onStatus).toHaveBeenCalledTimes(1)
    expect(onTrackChanged).toHaveBeenCalledWith(0, 1)
    expect(onSourceChange).toHaveBeenCalledWith('source-1')
    expect(snapshots.get(0)).toEqual({ currentTime: 10, duration: 100 })
  })

  test('ignores payloads from binaries without the counter', () => {
    const { listeners, playlist } = createPlaylist()
    const onAutoAdvanceCount = jest.fn()

    attachPlaylistListeners(
      playlist,
      { onStatus: jest.fn(), onTrackChanged: jest.fn() },
      new Map(),
      jest.fn(),
      ['source-0', 'source-1'],
      onAutoAdvanceCount,
    )

    listeners.playlistStatusUpdate?.({ currentIndex: 0, currentTime: 1, duration: 2 })
    listeners.trackChanged?.({ currentIndex: 1, previousIndex: 0 })

    expect(onAutoAdvanceCount).not.toHaveBeenCalled()
  })
})

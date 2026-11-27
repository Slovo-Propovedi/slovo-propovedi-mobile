import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { type AudioPlayerData } from 'entities/sermon/@x/player'
import { mockConsole } from 'shared/mocks'
import { currentAudioAtom } from '../model'
import { hydrateCurrentAudio } from './hydrateCurrentAudio'

const AUDIO: AudioPlayerData = {
  artist: 'Author',
  artwork: null,
  audioUrl: 'https://example.com/audio.mp3',
  id: 'sermon-1',
  title: 'Test Sermon',
}

describe('hydrateCurrentAudio', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  test('keeps the hydrated track when the normalization write fails', async () => {
    mockConsole('error')
    const ctx = createCtx()
    jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('disk full'))

    await expect(hydrateCurrentAudio(ctx, AUDIO)).resolves.toEqual(AUDIO)
    expect(ctx.get(currentAudioAtom)).toEqual(AUDIO)
  })
})

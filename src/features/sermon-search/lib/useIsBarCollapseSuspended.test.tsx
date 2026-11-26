import { createCtx } from '@reatom/framework'
import { currentAudioAtom, isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import { type AudioPlayerData } from 'entities/sermon/@x/player'
import { renderHookWithProviders } from 'shared/mocks'
import { useIsBarCollapseSuspended } from './useIsBarCollapseSuspended'

const AUDIO: AudioPlayerData = {
  artist: 'Author',
  artwork: null,
  audioUrl: 'https://example.com/sermon.mp3',
  id: 'sermon-1',
  title: 'Sermon',
}

const renderSuspension = async ({
  audio = null,
  isPlayerExpanded = false,
}: {
  audio?: AudioPlayerData | null
  isPlayerExpanded?: boolean
}) => {
  const ctx = createCtx()
  currentAudioAtom(ctx, audio)
  isPlayerExpandedAtom(ctx, isPlayerExpanded)

  const { result } = await renderHookWithProviders(() => useIsBarCollapseSuspended(), { ctx })

  return result.current
}

describe('useIsBarCollapseSuspended', () => {
  test('stays suspended while no sermon is active', async () => {
    expect(await renderSuspension({})).toBe(true)
  })

  test('allows collapse when a sermon is active and the player is not expanded', async () => {
    expect(await renderSuspension({ audio: AUDIO })).toBe(false)
  })

  test('stays suspended while the player is expanded', async () => {
    expect(await renderSuspension({ audio: AUDIO, isPlayerExpanded: true })).toBe(true)
  })
})

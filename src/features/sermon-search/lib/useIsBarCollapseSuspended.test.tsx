import { createCtx } from '@reatom/framework'
import { currentAudioAtom, isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import { type AudioPlayerData } from 'entities/sermon/@x/player'
import { renderHookWithProviders } from 'shared/mocks'
import { isSearchOpenAtom, searchQueryAtom } from '../model'
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
  isSearchOpen = false,
  query = '',
}: {
  audio?: AudioPlayerData | null
  isPlayerExpanded?: boolean
  isSearchOpen?: boolean
  query?: string
}) => {
  const ctx = createCtx()
  currentAudioAtom(ctx, audio)
  isPlayerExpandedAtom(ctx, isPlayerExpanded)
  isSearchOpenAtom(ctx, isSearchOpen)
  searchQueryAtom(ctx, query)

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

  test('stays suspended while an active search pins the field', async () => {
    expect(await renderSuspension({ audio: AUDIO, isSearchOpen: true, query: 'вера' })).toBe(true)
  })
})

import { createCtx } from '@reatom/framework'
import { currentAudioAtom, isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import { type AudioPlayerData } from 'entities/sermon/@x/player'
import { renderHookWithProviders } from 'shared/mocks'
import { isBarCollapsedAtom } from 'shared/ui/layout'
import { isSearchOpenAtom, searchQueryAtom } from '../model'
import { useSearchBarCollapse } from './useSearchBarCollapse'

const AUDIO: AudioPlayerData = {
  artist: 'Author',
  artwork: null,
  audioUrl: 'https://example.com/sermon.mp3',
  id: 'sermon-1',
  title: 'Sermon',
}

interface BarCollapseInput {
  isSuspended?: boolean
}

const mockUseBarCollapseOnScroll = jest.fn((_input: BarCollapseInput) => ({
  onScroll: jest.fn(),
}))

jest.mock('shared/ui/layout', () => {
  const actual = jest.requireActual('shared/ui/layout')

  return {
    ...actual,
    useBarCollapseOnScroll: (input: BarCollapseInput) => mockUseBarCollapseOnScroll(input),
  }
})

const renderSuspension = async ({
  audio = AUDIO,
  isCollapsed = false,
  isOpen,
  isPlayerExpanded = false,
  query,
}: {
  audio?: AudioPlayerData | null
  isCollapsed?: boolean
  isOpen: boolean
  isPlayerExpanded?: boolean
  query: string
}) => {
  const ctx = createCtx()
  isBarCollapsedAtom(ctx, isCollapsed)
  isSearchOpenAtom(ctx, isOpen)
  searchQueryAtom(ctx, query)
  isPlayerExpandedAtom(ctx, isPlayerExpanded)
  currentAudioAtom(ctx, audio)

  const { result } = await renderHookWithProviders(() => useSearchBarCollapse(), { ctx })
  const lastInput = mockUseBarCollapseOnScroll.mock.calls.at(-1)?.[0]

  return { ctx, lastInput, result }
}

describe('useSearchBarCollapse', () => {
  beforeEach(() => {
    mockUseBarCollapseOnScroll.mockClear()
  })

  test('does not suspend the driver for an open search with an empty query', async () => {
    const { lastInput } = await renderSuspension({ isOpen: true, query: '' })

    expect(lastInput?.isSuspended).toBe(false)
  })

  test('suspends the driver while an active query pins the field', async () => {
    const { lastInput } = await renderSuspension({ isOpen: true, query: 'вера' })

    expect(lastInput?.isSuspended).toBe(true)
  })

  test('suspends the driver while the player is expanded', async () => {
    const { lastInput } = await renderSuspension({
      isOpen: false,
      isPlayerExpanded: true,
      query: '',
    })

    expect(lastInput?.isSuspended).toBe(true)
  })

  test('does not suspend the driver while search is closed', async () => {
    const { lastInput } = await renderSuspension({ isOpen: false, query: '' })

    expect(lastInput?.isSuspended).toBe(false)
  })

  test('suspends the driver while no sermon is active', async () => {
    const { lastInput } = await renderSuspension({ audio: null, isOpen: false, query: '' })

    expect(lastInput?.isSuspended).toBe(true)
  })
})

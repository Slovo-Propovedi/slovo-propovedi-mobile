import { type Atom, createCtx, action as mockAction, atom as mockAtom } from '@reatom/framework'
import { act, waitFor } from '@testing-library/react-native'
import { useTourActionRegistrar } from 'features/onboarding'
import { searchQueryAtom } from 'features/sermon-search'
import { type SermonData } from 'entities/sermon'
import { renderHookWithProviders } from 'shared/mocks'
import { useSearchTourActions } from './useSearchTourActions'

jest.mock('features/onboarding', () => ({
  useTourActionRegistrar: jest.fn(),
}))

// The real barrel drags in the player/native audio graph; the hook only needs the
// query, the input-request signal and the results atom, so mock the module with
// fresh ones. `typeSearchInput` mirrors the real action: it sets the query and
// bumps the request so the visible SearchBar adopts the text.
jest.mock('features/sermon-search', () => {
  const mockSearchQueryAtom = mockAtom('', 'mockSearchQueryAtom')
  const mockSearchInputRequestAtom = mockAtom<{ nonce: number; text: string } | null>(
    null,
    'mockSearchInputRequestAtom',
  )
  const mockTypeSearchInput = mockAction((ctx: ReturnType<typeof createCtx>, text: string) => {
    const previous = ctx.get(mockSearchInputRequestAtom)

    mockSearchQueryAtom(ctx, text)
    mockSearchInputRequestAtom(ctx, { nonce: (previous?.nonce ?? 0) + 1, text })
  }, 'mockTypeSearchInput')

  return {
    searchInputRequestAtom: mockSearchInputRequestAtom,
    searchQueryAtom: mockSearchQueryAtom,
    typeSearchInput: mockTypeSearchInput,
  }
})

const OPEN_SEARCH = 'open-listen-search'
const TYPE_QUERY = 'type-search-query'
const PRESS_FIRST_SERMON = 'press-first-sermon'
const FULL_QUERY = 'лицемерие'

const SERMON: SermonData = {
  artist: 'Проповедник',
  artwork: null,
  audioUrl: 'https://example.com/sermon.mp3',
  id: 'sermon-1',
  title: 'Проповедь',
}

const getRegisteredAction = (id: string) => {
  const matches = jest
    .mocked(useTourActionRegistrar)
    .mock.calls.filter(([registeredId]) => registeredId === id)

  return matches.at(-1)?.[1]
}

// The state the visible SearchBar input adopts its text from.
const getSearchInputRequest = () =>
  jest.requireMock<{ searchInputRequestAtom: Atom<{ nonce: number; text: string } | null> }>(
    'features/sermon-search',
  ).searchInputRequestAtom

const renderActions = async (
  onPressFirstSermon: (sermon: SermonData) => void,
  firstSermon: SermonData | undefined = undefined,
  onOpenSearch: () => void = jest.fn(),
) => {
  const ctx = createCtx()

  await renderHookWithProviders(
    () =>
      useSearchTourActions({
        getFirstSermon: () => firstSermon,
        onOpenSearch,
        onPressFirstSermon,
      }),
    { ctx },
  )

  return ctx
}

describe('useSearchTourActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('opens the search without typing the demo query', async () => {
    const onOpenSearch = jest.fn()
    const ctx = await renderActions(jest.fn(), undefined, onOpenSearch)

    await act(async () => {
      getRegisteredAction(OPEN_SEARCH)?.()
    })

    expect(onOpenSearch).toHaveBeenCalledTimes(1)
    expect(ctx.get(searchQueryAtom)).toBe('')
    expect(ctx.get(getSearchInputRequest())).toBeNull()
  })

  test('types the full demo query prefix by prefix into the visible input state', async () => {
    const ctx = await renderActions(jest.fn())
    const inputRequest = getSearchInputRequest()

    await act(async () => {
      getRegisteredAction(TYPE_QUERY)?.()
    })

    // The first character lands synchronously; the rest follow on real delays.
    expect(ctx.get(searchQueryAtom)).toBe('л')
    expect(ctx.get(inputRequest)?.text).toBe('л')

    await waitFor(() => expect(ctx.get(inputRequest)?.text).toBe(FULL_QUERY), { timeout: 3000 })
    expect(ctx.get(searchQueryAtom)).toBe(FULL_QUERY)
  })

  test('stops typing when the sequence is cancelled on unmount', async () => {
    const ctx = createCtx()
    const { unmount } = await renderHookWithProviders(
      () =>
        useSearchTourActions({
          getFirstSermon: () => undefined,
          onOpenSearch: jest.fn(),
          onPressFirstSermon: jest.fn(),
        }),
      { ctx },
    )

    await act(async () => {
      getRegisteredAction(TYPE_QUERY)?.()
    })

    const typedBeforeUnmount = ctx.get(searchQueryAtom)
    const requestBeforeUnmount = ctx.get(getSearchInputRequest())
    await unmount()
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
    })

    expect(ctx.get(searchQueryAtom)).toBe(typedBeforeUnmount)
    expect(ctx.get(getSearchInputRequest())).toEqual(requestBeforeUnmount)
  })

  test('presses the first rendered sermon', async () => {
    const onPressFirstSermon = jest.fn()
    await renderActions(onPressFirstSermon, SERMON)

    await act(async () => {
      getRegisteredAction(PRESS_FIRST_SERMON)?.()
    })

    expect(onPressFirstSermon).toHaveBeenCalledWith(SERMON)
  })

  test('does nothing when no sermon is rendered', async () => {
    const onPressFirstSermon = jest.fn()
    await renderActions(onPressFirstSermon)

    await act(async () => {
      getRegisteredAction(PRESS_FIRST_SERMON)?.()
    })

    expect(onPressFirstSermon).not.toHaveBeenCalled()
  })
})

import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { renderHookWithProviders } from 'shared/mocks'
import { isBarCollapsedAtom, setBarCollapsed } from 'shared/ui/layout'
import { searchFocusRequestAtom } from '../model-searchField'
import { useOpenSearch } from './useOpenSearch'

const mockNavigate = jest.fn()
let mockPathname = '/listen'

jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ navigate: mockNavigate }),
}))

const renderOpen = async () => {
  const ctx = createCtx()
  const { result } = await renderHookWithProviders(() => useOpenSearch(), { ctx })

  return { ctx, open: result.current }
}

describe('useOpenSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPathname = '/listen'
  })

  test('expands the bar and opens the route from another tab', async () => {
    const { ctx, open } = await renderOpen()
    setBarCollapsed(ctx, true)

    await act(async () => open())

    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
    expect(ctx.get(searchFocusRequestAtom)).toBe(0)
    expect(mockNavigate).toHaveBeenCalledWith('/search')
  })

  test('focuses the page field instead of re-navigating on the search index', async () => {
    mockPathname = '/search'
    const { ctx, open } = await renderOpen()
    setBarCollapsed(ctx, true)

    await act(async () => open())

    // The page owns the field: the circle only asks it to focus again.
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(ctx.get(searchFocusRequestAtom)).toBe(1)
  })

  test('returns to the index from a nested detail instead of focusing underneath it', async () => {
    mockPathname = '/search/playlist'
    const { ctx, open } = await renderOpen()

    await act(async () => open())

    expect(mockNavigate).toHaveBeenCalledWith('/search')
    expect(ctx.get(searchFocusRequestAtom)).toBe(0)
  })
})

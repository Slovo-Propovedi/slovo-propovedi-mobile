import { act } from '@testing-library/react-native'
import { renderHookWithProviders } from 'shared/mocks'
import { isSearchOpenAtom, searchQueryAtom } from '../model'
import { useCloseSearch } from './useCloseSearch'

const mockBack = jest.fn()
const mockNavigate = jest.fn()
let mockCanGoBack = true
let mockPathname = '/search'

jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    back: mockBack,
    canGoBack: () => mockCanGoBack,
    navigate: mockNavigate,
  }),
}))

const renderClose = async () => {
  const { ctx, result } = await renderHookWithProviders(() => useCloseSearch())

  return { close: result.current, ctx }
}

describe('useCloseSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCanGoBack = true
    mockPathname = '/search'
  })

  test('pops the plain /search route and clears the session', async () => {
    const { close, ctx } = await renderClose()
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'вера')

    await act(async () => close())

    expect(ctx.get(isSearchOpenAtom)).toBe(false)
    expect(ctx.get(searchQueryAtom)).toBe('')
    expect(mockBack).toHaveBeenCalledTimes(1)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('leaves search entirely when the current pathname is a nested detail', async () => {
    mockPathname = '/search/playlist'
    const { close, ctx } = await renderClose()
    isSearchOpenAtom(ctx, true)

    await act(async () => close())

    // back() would only pop the detail and keep search open.
    expect(mockNavigate).toHaveBeenCalledWith('/listen')
    expect(mockBack).not.toHaveBeenCalled()
    expect(ctx.get(isSearchOpenAtom)).toBe(false)
  })

  test('navigates to the listen tab when /search has no history to pop', async () => {
    mockCanGoBack = false
    const { close } = await renderClose()

    await act(async () => close())

    expect(mockBack).not.toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/listen')
  })
})

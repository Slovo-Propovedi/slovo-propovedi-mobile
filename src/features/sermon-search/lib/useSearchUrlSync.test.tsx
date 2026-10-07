import { createCtx } from '@reatom/framework'
import { act, waitFor } from '@testing-library/react-native'
import { Platform } from 'react-native'
import { renderHookWithProviders, renderWithProviders } from 'shared/mocks'
import { isSearchOpenAtom, searchQueryAtom } from '../model'
import { fetchSermonResults } from './searchSources'
import { useDebouncedSearch } from './useDebouncedSearch'
import { useSearchUrlSync } from './useSearchUrlSync'

const mockReplace = jest.fn()
let mockParams: { search?: string } = {}

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ replace: mockReplace }),
}))

jest.mock('./searchSources', () => ({
  fetchPlaylistTitleMatches: jest.fn().mockResolvedValue({ data: [], fromNetwork: true }),
  fetchSermonResults: jest.fn().mockResolvedValue({ data: [], fromNetwork: true }),
  persistPlaylistSearchResults: jest.fn(),
  persistSearchResults: jest.fn(),
  persistSermonSearchResults: jest.fn(),
}))

describe('useSearchUrlSync', () => {
  let platformSpy: ReturnType<typeof jest.replaceProperty>

  beforeEach(() => {
    jest.clearAllMocks()
    mockParams = {}
    platformSpy = jest.replaceProperty(Platform, 'OS', 'web')
  })

  afterEach(() => {
    platformSpy.restore()
  })

  test('seeds search mode from a deep-linked ?search=', async () => {
    mockParams = { search: 'вера' }
    const ctx = createCtx()

    await renderHookWithProviders(() => useSearchUrlSync(), { ctx })
    await act(async () => {})

    expect(ctx.get(searchQueryAtom)).toBe('вера')
    expect(ctx.get(isSearchOpenAtom)).toBe(true)
    expect(mockReplace).not.toHaveBeenCalled()
  })

  test('mirrors a changed query into the URL with a debounced replace', async () => {
    const ctx = createCtx()
    await renderHookWithProviders(() => useSearchUrlSync(), { ctx })

    await act(async () => {
      searchQueryAtom(ctx, 'любовь')
    })

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({
        params: { search: 'любовь' },
        pathname: '/listen',
      }),
    )
  })

  test('strips the param when the query is cleared', async () => {
    mockParams = { search: 'вера' }
    const ctx = createCtx()
    await renderHookWithProviders(() => useSearchUrlSync(), { ctx })
    await act(async () => {})
    mockReplace.mockClear()

    await act(async () => {
      searchQueryAtom(ctx, '')
    })

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith({ pathname: '/listen' }))
  })

  test('is a no-op on native', async () => {
    platformSpy.restore()
    platformSpy = jest.replaceProperty(Platform, 'OS', 'ios')
    mockParams = { search: 'вера' }
    const ctx = createCtx()

    await renderHookWithProviders(() => useSearchUrlSync(), { ctx })
    await act(async () => {})

    expect(ctx.get(searchQueryAtom)).toBe('')
    expect(mockReplace).not.toHaveBeenCalled()
  })

  test('deep-link seed fetches exactly once (no duplicate debounced fetch)', async () => {
    mockParams = { search: 'вера' }
    const ctx = createCtx()
    const Probe = () => {
      useSearchUrlSync()
      useDebouncedSearch()
      return null
    }

    await renderWithProviders(<Probe />, { ctx })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
    })

    expect(jest.mocked(fetchSermonResults)).toHaveBeenCalledTimes(1)
  })
})

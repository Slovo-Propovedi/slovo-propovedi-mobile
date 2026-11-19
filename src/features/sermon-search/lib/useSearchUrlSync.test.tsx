import { createCtx } from '@reatom/framework'
import { act, waitFor } from '@testing-library/react-native'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { renderHookWithProviders, renderWithProviders } from 'shared/mocks'
import { searchQueryAtom } from '../model'
import { useSearchUrlSync } from './useSearchUrlSync'

const mockSetParams = jest.fn()
let mockParams: { search?: string } = {}

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({
    setParams: (...args: unknown[]) => mockSetParams(...args),
  }),
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
    expect(mockSetParams).not.toHaveBeenCalled()
  })

  test('mirrors a changed query into the current route params with a debounced setParams', async () => {
    const ctx = createCtx()
    await renderHookWithProviders(() => useSearchUrlSync(), { ctx })

    await act(async () => {
      searchQueryAtom(ctx, 'любовь')
    })

    await waitFor(() => expect(mockSetParams).toHaveBeenCalledWith({ search: 'любовь' }))
  })

  test('does not remount the screen that owns the focused input when the URL mirror fires', async () => {
    const ctx = createCtx()
    let mountCount = 0

    const FocusedField = () => {
      useEffect(() => {
        mountCount += 1
      }, [])

      return null
    }

    const Screen = () => {
      useSearchUrlSync()

      return <FocusedField />
    }

    await renderWithProviders(<Screen />, { ctx })

    await act(async () => {
      searchQueryAtom(ctx, 'любовь')
      await new Promise(resolve => setTimeout(resolve, 500))
    })

    expect(mockSetParams).toHaveBeenCalledWith({ search: 'любовь' })
    expect(mountCount).toBe(1)
  })

  test('strips the param when the query is cleared', async () => {
    mockParams = { search: 'вера' }
    const ctx = createCtx()
    await renderHookWithProviders(() => useSearchUrlSync(), { ctx })
    await act(async () => {})
    mockSetParams.mockClear()

    await act(async () => {
      searchQueryAtom(ctx, '')
    })

    await waitFor(() => expect(mockSetParams).toHaveBeenCalledWith({ search: undefined }))
  })

  test('is a no-op on native', async () => {
    platformSpy.restore()
    platformSpy = jest.replaceProperty(Platform, 'OS', 'ios')
    mockParams = { search: 'вера' }
    const ctx = createCtx()

    await renderHookWithProviders(() => useSearchUrlSync(), { ctx })
    await act(async () => {})

    expect(ctx.get(searchQueryAtom)).toBe('')
    expect(mockSetParams).not.toHaveBeenCalled()
  })
})

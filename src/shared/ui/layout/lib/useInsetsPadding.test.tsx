import { act } from '@testing-library/react-native'
import * as Reanimated from 'react-native-reanimated'
import { renderHookWithProviders } from '../../../mocks/renderWithProviders'
import { usePersistentSharedValue } from '../../../mocks/usePersistentSharedValue'
import { useInsetsPadding, useInsetsSpace } from './useInsetsPadding'

const mockedWithTiming = Reanimated.withTiming as jest.Mock

let mockInsets = { left: 0, right: 0, top: 20 }

describe('useInsetsPadding', () => {
  beforeEach(() => {
    mockInsets = { left: 0, right: 0, top: 20 }
    mockedWithTiming.mockClear()
    jest
      .spyOn(Reanimated, 'useSharedValue')
      .mockImplementation(usePersistentSharedValue as unknown as typeof Reanimated.useSharedValue)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('the first delivery snaps every edge', async () => {
    const { result } = await renderHookWithProviders(() => useInsetsPadding(mockInsets))

    expect(mockedWithTiming).not.toHaveBeenCalled()
    expect(result.current).toEqual({ paddingLeft: 0, paddingRight: 0, paddingTop: 20 })
  })

  test('a later top inset change snaps immediately', async () => {
    const { rerender, result } = await renderHookWithProviders(() => useInsetsPadding(mockInsets))

    mockInsets = { left: 0, right: 0, top: 0 }
    await act(async () => {
      await rerender(undefined)
    })

    expect(mockedWithTiming).not.toHaveBeenCalled()
    // The mock recomputes the animated style at render time, so the direct
    // assignment lands in the shared value but shows up in the style on the
    // next commit. No frame is spent travelling to the new value.
    await act(async () => {
      await rerender(undefined)
    })
    expect(result.current).toEqual({ paddingLeft: 0, paddingRight: 0, paddingTop: 0 })
  })

  test('a lateral inset change snaps too (camera cutout after a rotation)', async () => {
    const { rerender, result } = await renderHookWithProviders(() => useInsetsPadding(mockInsets))

    mockInsets = { left: 44, right: 0, top: 20 }
    await act(async () => {
      await rerender(undefined)
    })

    expect(mockedWithTiming).not.toHaveBeenCalled()
    await act(async () => {
      await rerender(undefined)
    })
    expect(result.current).toEqual({ paddingLeft: 44, paddingRight: 0, paddingTop: 20 })
  })

  test('the bottom chrome space snaps on every delivery', async () => {
    const { rerender, result } = await renderHookWithProviders(() => useInsetsSpace(mockInsets.top))

    expect(mockedWithTiming).not.toHaveBeenCalled()
    expect(result.current).toEqual({ height: 20 })

    mockInsets = { left: 0, right: 0, top: 34 }
    await act(async () => {
      await rerender(undefined)
    })

    expect(mockedWithTiming).not.toHaveBeenCalled()
    await act(async () => {
      await rerender(undefined)
    })
    expect(result.current).toEqual({ height: 34 })
  })
})

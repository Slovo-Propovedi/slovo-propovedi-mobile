import { act } from '@testing-library/react-native'
import * as Reanimated from 'react-native-reanimated'
import { renderHookWithProviders } from '../../../mocks/renderWithProviders'
import { usePersistentSharedValue } from '../../../mocks/usePersistentSharedValue'
import {
  INSETS_GLIDE_MS,
  useSmoothInsetsPadding,
  useSmoothInsetsSpace,
} from './useSmoothInsetsPadding'

const mockedWithTiming = Reanimated.withTiming as jest.Mock

let mockInsets = { left: 0, right: 0, top: 20 }

describe('useSmoothInsetsPadding', () => {
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

  test('the first delivery snaps every edge: no tween on mount', async () => {
    const { result } = await renderHookWithProviders(() => useSmoothInsetsPadding(mockInsets))

    expect(mockedWithTiming).not.toHaveBeenCalled()
    expect(result.current).toEqual({ paddingLeft: 0, paddingRight: 0, paddingTop: 20 })
  })

  test('a later top inset change glides to the new value', async () => {
    const { rerender, result } = await renderHookWithProviders(() =>
      useSmoothInsetsPadding(mockInsets),
    )

    mockInsets = { left: 0, right: 0, top: 0 }
    await act(async () => {
      await rerender(undefined)
    })

    expect(mockedWithTiming).toHaveBeenCalledWith(0, { duration: INSETS_GLIDE_MS })
    // The mock recomputes the animated style at render time, so the glide has
    // landed in the shared value but shows up in the style on the next commit.
    await act(async () => {
      await rerender(undefined)
    })
    expect(result.current).toEqual({ paddingLeft: 0, paddingRight: 0, paddingTop: 0 })
    expect(mockedWithTiming).toHaveBeenCalledTimes(1)
  })

  test('a lateral inset change glides too (camera cutout after a rotation)', async () => {
    const { rerender, result } = await renderHookWithProviders(() =>
      useSmoothInsetsPadding(mockInsets),
    )

    mockInsets = { left: 44, right: 0, top: 20 }
    await act(async () => {
      await rerender(undefined)
    })

    expect(mockedWithTiming).toHaveBeenCalledWith(44, { duration: INSETS_GLIDE_MS })
    await act(async () => {
      await rerender(undefined)
    })
    expect(result.current).toEqual({ paddingLeft: 44, paddingRight: 0, paddingTop: 20 })
  })

  test('the bottom chrome space snaps on the first delivery and glides after it', async () => {
    const { rerender, result } = await renderHookWithProviders(() =>
      useSmoothInsetsSpace(mockInsets.top),
    )

    expect(mockedWithTiming).not.toHaveBeenCalled()
    expect(result.current).toEqual({ height: 20 })

    mockInsets = { left: 0, right: 0, top: 34 }
    await act(async () => {
      await rerender(undefined)
    })

    expect(mockedWithTiming).toHaveBeenCalledWith(34, { duration: INSETS_GLIDE_MS })
  })
})

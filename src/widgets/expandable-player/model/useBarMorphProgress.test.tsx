import { act } from '@testing-library/react-native'
import { withTiming } from 'react-native-reanimated'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { BAR_MORPH_DURATION_MS } from 'shared/ui/layout'
import { useBarMorphProgress } from './useBarMorphProgress'

const mockedWithTiming = withTiming as jest.Mock

describe('useBarMorphProgress', () => {
  test('assigns the initial value without animating', async () => {
    const { result } = await renderHookWithProviders(() => useBarMorphProgress(true))

    expect(result.current.value).toBe(1)
    expect(mockedWithTiming).not.toHaveBeenCalled()
  })

  test('animates with the same duration as the tab-bar morph', async () => {
    const { rerender, result } = await renderHookWithProviders(
      ({ isCollapsed }: { isCollapsed: boolean }) => useBarMorphProgress(isCollapsed),
      { initialProps: { isCollapsed: false } },
    )

    mockedWithTiming.mockClear()

    await act(async () => {
      rerender({ isCollapsed: true })
    })

    expect(mockedWithTiming).toHaveBeenCalledWith(1, { duration: BAR_MORPH_DURATION_MS })
    expect(result.current.value).toBe(1)
  })
})

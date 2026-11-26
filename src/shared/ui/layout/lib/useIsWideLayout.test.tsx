import { renderHookWithProviders } from '../../../mocks/renderWithProviders'
import { useIsWideLayout } from './useIsWideLayout'

let mockWindowWidth = 0

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ fontScale: 1, height: 800, width: mockWindowWidth }),
}))

describe('useIsWideLayout', () => {
  test('phone width (767) is not wide', async () => {
    mockWindowWidth = 767
    const { result } = await renderHookWithProviders(() => useIsWideLayout())

    expect(result.current).toBe(false)
  })

  test('tablet width (768) is wide at the boundary', async () => {
    mockWindowWidth = 768
    const { result } = await renderHookWithProviders(() => useIsWideLayout())

    expect(result.current).toBe(true)
  })

  test('desktop width (1024) is wide', async () => {
    mockWindowWidth = 1024
    const { result } = await renderHookWithProviders(() => useIsWideLayout())

    expect(result.current).toBe(true)
  })
})

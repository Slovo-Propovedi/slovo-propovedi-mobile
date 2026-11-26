import { renderHookWithProviders } from '../../../mocks/renderWithProviders'
import { useIsWideLayout } from './useIsWideLayout'

let mockWindowHeight = 0
let mockWindowWidth = 0

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ fontScale: 1, height: mockWindowHeight, width: mockWindowWidth }),
}))

const renderAt = async (width: number, height: number) => {
  mockWindowWidth = width
  mockWindowHeight = height

  const { result } = await renderHookWithProviders(() => useIsWideLayout())

  return result.current
}

describe('useIsWideLayout', () => {
  test('iPad mini portrait (744×1136) is wide', async () => {
    expect(await renderAt(744, 1136)).toBe(true)
  })

  test('iPhone landscape (844×390) is not wide: the shortest side is phone-class', async () => {
    expect(await renderAt(844, 390)).toBe(false)
  })

  test('desktop window (1280×800) is wide', async () => {
    expect(await renderAt(1280, 800)).toBe(true)
  })

  test('small web window (900×500) is not wide: the shortest side is below 600', async () => {
    expect(await renderAt(900, 500)).toBe(false)
  })

  test('tablet thresholds (768×600) are wide at the boundary', async () => {
    expect(await renderAt(768, 600)).toBe(true)
  })

  test('a tablet-class shortest side alone is not enough: 600×767 stays compact', async () => {
    // The long-side clause: 600 clears the shortest-side gate, but 767 is one
    // point below the 768 long-side threshold.
    expect(await renderAt(600, 767)).toBe(false)
  })

  test('phone portrait (390×844) is not wide', async () => {
    expect(await renderAt(390, 844)).toBe(false)
  })
})

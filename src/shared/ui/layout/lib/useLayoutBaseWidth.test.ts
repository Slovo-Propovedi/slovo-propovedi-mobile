import { act } from '@testing-library/react-native'
import { Platform } from 'react-native'
import { renderHookWithProviders } from '../../../mocks/renderWithProviders'
import { useLayoutBaseWidth } from './useLayoutBaseWidth'

const ORIGINAL_PLATFORM = Platform.OS

let mockWindowHeight = 0
let mockWindowWidth = 0

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ fontScale: 1, height: mockWindowHeight, width: mockWindowWidth }),
}))

const setWindow = (width: number, height: number) => {
  mockWindowWidth = width
  mockWindowHeight = height
}

const renderAt = async (width: number, height: number) => {
  setWindow(width, height)

  const { rerender, result } = await renderHookWithProviders(() => useLayoutBaseWidth())

  return { rerender, result }
}

describe('useLayoutBaseWidth', () => {
  beforeEach(() => {
    setWindow(390, 844)
  })

  afterEach(() => {
    Platform.OS = ORIGINAL_PLATFORM
  })

  test('is the portrait width of a phone', async () => {
    const { result } = await renderAt(390, 844)

    expect(result.current).toBe(390)
  })

  test('does not change when the phone rotates: the short side is the base', async () => {
    const { rerender, result } = await renderAt(390, 844)

    setWindow(844, 390)
    await act(async () => {
      await rerender({})
    })

    // Rotation swaps the sides; the base is the short one either way, so the
    // chrome keeps its portrait width instead of re-deriving a landscape one.
    expect(result.current).toBe(390)
  })

  test('does not change on the way back from landscape', async () => {
    const { rerender, result } = await renderAt(844, 390)

    setWindow(390, 844)
    await act(async () => {
      await rerender({})
    })

    expect(result.current).toBe(390)
  })

  test('follows a real resize inside one orientation', async () => {
    const { rerender, result } = await renderAt(390, 844)

    setWindow(390, 640)
    await act(async () => {
      await rerender({})
    })

    // Split-screen/window resizes are not rotations: the base tracks them.
    expect(result.current).toBe(390)

    setWindow(320, 640)
    await act(async () => {
      await rerender({})
    })

    expect(result.current).toBe(320)
  })

  test('is the short side of a tablet window, not its long one', async () => {
    const { result } = await renderAt(1024, 768)

    expect(result.current).toBe(768)
  })

  test('is the short side of a square window', async () => {
    const { result } = await renderAt(700, 700)

    expect(result.current).toBe(700)
  })

  test('web keeps the live window width so the desktop column is not narrowed to the short side', async () => {
    // On a desktop window the short side (500) is not the layout base: the
    // phone-style column is capped later by CONTENT_COLUMN_WIDTH, so a 1366x500
    // window must keep a 600-wide column instead of a 500-wide one.
    Platform.OS = 'web'

    const { result } = await renderAt(1366, 500)

    expect(result.current).toBe(1366)
  })
})

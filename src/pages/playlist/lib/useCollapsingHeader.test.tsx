import { act } from '@testing-library/react-native'
import { renderHookWithProviders } from 'shared/mocks'
import { useCollapsingHeader } from './useCollapsingHeader'

const HEADER_HEIGHT = 100
const BASE_IMAGE_RATIO = 0.5
let mockWindowHeight = 800

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ fontScale: 1, height: mockWindowHeight, width: 400 }),
}))

jest.mock('expo-router/react-navigation', () => ({
  useHeaderHeight: () => HEADER_HEIGHT,
}))

jest.mock('features/sermon-search/@x/suspension', () => ({
  useIsBarCollapseSuspended: () => false,
}))

describe('useCollapsingHeader', () => {
  beforeEach(() => {
    mockWindowHeight = 800
  })

  test('re-derives the header image height from the live window, not the launch one', async () => {
    const { rerender, result } = await renderHookWithProviders(
      (_props: { revision: number }) => useCollapsingHeader(),
      { initialProps: { revision: 0 } },
    )

    expect(result.current.headerImageHeight).toBe(800 * BASE_IMAGE_RATIO + HEADER_HEIGHT)

    // A rotation lands in landscape: the image must shrink with the viewport
    // instead of keeping the portrait height captured at module load.
    mockWindowHeight = 400
    await act(async () => {
      rerender({ revision: 1 })
    })

    expect(result.current.headerImageHeight).toBe(400 * BASE_IMAGE_RATIO + HEADER_HEIGHT)
  })
})

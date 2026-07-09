import { createCtx } from '@reatom/framework'
import { fireEvent } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { renderWithProviders } from 'shared/mocks'
import { isOnlineAtom } from 'shared/model'
import { NetworkBanner } from './NetworkBanner'
import { useNetworkIslandAnimation } from './useNetworkIslandAnimation'

const mockCollapse = jest.fn()
const mockExpand = jest.fn()

jest.mock('./useNetworkIslandAnimation', () => ({
  useNetworkIslandAnimation: jest.fn(),
}))

const mockedUseAnimation = useNetworkIslandAnimation as jest.MockedFunction<
  typeof useNetworkIslandAnimation
>

const STATUS_TEXT = 'Офлайн'
const BANNER_TEST_ID = 'network-banner'
const defaultHookReturn = {
  collapse: mockCollapse,
  containerStyle: {},
  contentStyle: {},
  expand: mockExpand,
  isExpanded: true,
}

describe('<NetworkBanner>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns null when online', async () => {
    const ctx = createCtx()
    mockedUseAnimation.mockReturnValue(defaultHookReturn as never)

    const { queryByTestId } = await renderWithProviders(<NetworkBanner />, { ctx })

    expect(queryByTestId(BANNER_TEST_ID)).toBeNull()
  })

  test('renders the banner when offline', async () => {
    const ctx = createCtx()
    isOnlineAtom(ctx, false)
    mockedUseAnimation.mockReturnValue({ ...defaultHookReturn, isExpanded: true } as never)

    const { getByTestId } = await renderWithProviders(<NetworkBanner />, { ctx })

    expect(getByTestId(BANNER_TEST_ID)).toBeTruthy()
  })

  test('shows offline text', async () => {
    const ctx = createCtx()
    isOnlineAtom(ctx, false)
    mockedUseAnimation.mockReturnValue({ ...defaultHookReturn, isExpanded: true } as never)

    const { getByText } = await renderWithProviders(<NetworkBanner />, { ctx })

    expect(getByText(STATUS_TEXT)).toBeTruthy()
  })

  test('hitSlop is 0 when expanded', async () => {
    const ctx = createCtx()
    isOnlineAtom(ctx, false)
    mockedUseAnimation.mockReturnValue({ ...defaultHookReturn, isExpanded: true } as never)

    const { getByTestId } = await renderWithProviders(<NetworkBanner />, { ctx })

    expect(getByTestId(BANNER_TEST_ID)).toHaveProp('hitSlop', 0)
  })

  test('hitSlop is 16 when collapsed', async () => {
    const ctx = createCtx()
    isOnlineAtom(ctx, false)
    mockedUseAnimation.mockReturnValue({ ...defaultHookReturn, isExpanded: false } as never)

    const { getByTestId } = await renderWithProviders(<NetworkBanner />, { ctx })

    expect(getByTestId(BANNER_TEST_ID)).toHaveProp('hitSlop', 16)
  })

  test('onPress calls collapse when expanded', async () => {
    const ctx = createCtx()
    isOnlineAtom(ctx, false)
    mockedUseAnimation.mockReturnValue({ ...defaultHookReturn, isExpanded: true } as never)

    const { getByTestId } = await renderWithProviders(<NetworkBanner />, { ctx })

    fireEvent.press(getByTestId(BANNER_TEST_ID))
    expect(mockCollapse).toHaveBeenCalledTimes(1)
    expect(mockExpand).not.toHaveBeenCalled()
  })

  test('onPress calls expand when collapsed', async () => {
    const ctx = createCtx()
    isOnlineAtom(ctx, false)
    mockedUseAnimation.mockReturnValue({ ...defaultHookReturn, isExpanded: false } as never)

    const { getByTestId } = await renderWithProviders(<NetworkBanner />, { ctx })

    fireEvent.press(getByTestId(BANNER_TEST_ID))
    expect(mockExpand).toHaveBeenCalledTimes(1)
    expect(mockCollapse).not.toHaveBeenCalled()
  })
})

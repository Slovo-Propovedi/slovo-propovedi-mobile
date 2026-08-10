import { createCtx } from '@reatom/framework'
import { fireEvent } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { Linking } from 'react-native'
import { renderWithProviders } from 'shared/mocks'
import { releaseUrlAtom, updateAvailableAtom } from 'shared/model'
import { UpdateBanner } from './UpdateBanner'
import { useUpdateIslandAnimation } from './useUpdateIslandAnimation'

const BANNER_TEST_ID = 'update-banner'
const RELEASE_URL = 'https://github.com/Slovo-Propovedi/slovo-propovedi-mobile/releases/tag/v0.3.0'

jest.mock('./useUpdateIslandAnimation', () => ({
  useUpdateIslandAnimation: jest.fn(),
}))

const mockedUseAnimation = useUpdateIslandAnimation as jest.MockedFunction<
  typeof useUpdateIslandAnimation
>

const defaultHookReturn = {
  collapse: jest.fn(),
  containerStyle: {},
  contentStyle: {},
  expand: jest.fn(),
  isExpanded: true,
}

describe('<UpdateBanner>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns null when no update is available', async () => {
    mockedUseAnimation.mockReturnValue(defaultHookReturn as never)

    const { queryByTestId } = await renderWithProviders(<UpdateBanner />)

    expect(queryByTestId(BANNER_TEST_ID)).toBeNull()
  })

  test('renders the banner when an update is available', async () => {
    const ctx = createCtx()
    updateAvailableAtom(ctx, true)
    releaseUrlAtom(ctx, RELEASE_URL)
    mockedUseAnimation.mockReturnValue(defaultHookReturn as never)

    const { getByTestId } = await renderWithProviders(<UpdateBanner />, { ctx })

    expect(getByTestId(BANNER_TEST_ID)).toBeTruthy()
  })

  test('opens the release URL when the expanded banner is pressed', async () => {
    const ctx = createCtx()
    updateAvailableAtom(ctx, true)
    releaseUrlAtom(ctx, RELEASE_URL)
    mockedUseAnimation.mockReturnValue(defaultHookReturn as never)
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)

    const { getByTestId } = await renderWithProviders(<UpdateBanner />, { ctx })

    fireEvent.press(getByTestId(BANNER_TEST_ID))

    expect(openURLSpy).toHaveBeenCalledWith(RELEASE_URL)
  })

  test('does not open non-https URLs', async () => {
    const ctx = createCtx()
    updateAvailableAtom(ctx, true)
    releaseUrlAtom(ctx, 'http://evil.com')
    mockedUseAnimation.mockReturnValue(defaultHookReturn as never)
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)

    const { getByTestId } = await renderWithProviders(<UpdateBanner />, { ctx })

    fireEvent.press(getByTestId(BANNER_TEST_ID))

    expect(openURLSpy).not.toHaveBeenCalled()
  })

  test('does not open the URL when releaseUrl is null', async () => {
    const ctx = createCtx()
    updateAvailableAtom(ctx, true)
    releaseUrlAtom(ctx, null)
    mockedUseAnimation.mockReturnValue(defaultHookReturn as never)
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)

    const { getByTestId } = await renderWithProviders(<UpdateBanner />, { ctx })

    fireEvent.press(getByTestId(BANNER_TEST_ID))

    expect(openURLSpy).not.toHaveBeenCalled()
  })
})

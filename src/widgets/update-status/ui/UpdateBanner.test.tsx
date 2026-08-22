import { createCtx } from '@reatom/framework'
import { fireEvent } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { renderWithProviders } from 'shared/mocks'
import { updateAvailableAtom } from 'shared/model'
import { UpdateBanner } from './UpdateBanner'
import { useUpdateIslandAnimation } from './useUpdateIslandAnimation'

const BANNER_TEST_ID = 'update-banner'
const DIALOG_TITLE = 'Доступно обновление'

jest.mock('./useUpdateIslandAnimation', () => ({
  useUpdateIslandAnimation: jest.fn(),
}))

jest.mock('features/app-update', () => ({
  useUpdateInstall: () => ({
    error: null,
    progress: 0,
    reset: jest.fn(),
    startUpdate: jest.fn(),
    updateState: 'idle',
  }),
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
    mockedUseAnimation.mockReturnValue(defaultHookReturn as never)
  })

  test('returns null when no update is available', async () => {
    const { queryByTestId } = await renderWithProviders(<UpdateBanner />)

    expect(queryByTestId(BANNER_TEST_ID)).toBeNull()
  })

  test('renders the banner when an update is available', async () => {
    const ctx = createCtx()
    updateAvailableAtom(ctx, true)

    const { getByTestId } = await renderWithProviders(<UpdateBanner />, { ctx })

    expect(getByTestId(BANNER_TEST_ID)).toBeTruthy()
  })

  test('does not show the dialog before the banner is pressed', async () => {
    const ctx = createCtx()
    updateAvailableAtom(ctx, true)

    const { queryByText } = await renderWithProviders(<UpdateBanner />, { ctx })

    expect(queryByText(DIALOG_TITLE)).toBeNull()
  })

  test('shows the update dialog when the expanded banner is pressed', async () => {
    const ctx = createCtx()
    updateAvailableAtom(ctx, true)

    const { findByText, getByTestId } = await renderWithProviders(<UpdateBanner />, { ctx })

    fireEvent.press(getByTestId(BANNER_TEST_ID))

    expect(await findByText(DIALOG_TITLE)).toBeTruthy()
  })

  test('expands the pill instead of showing the dialog when collapsed', async () => {
    const ctx = createCtx()
    updateAvailableAtom(ctx, true)
    mockedUseAnimation.mockReturnValue({ ...defaultHookReturn, isExpanded: false } as never)

    const { getByTestId, queryByText } = await renderWithProviders(<UpdateBanner />, { ctx })

    fireEvent.press(getByTestId(BANNER_TEST_ID))

    expect(defaultHookReturn.expand).toHaveBeenCalledTimes(1)
    expect(queryByText(DIALOG_TITLE)).toBeNull()
  })
})

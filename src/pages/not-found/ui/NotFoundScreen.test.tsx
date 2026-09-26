import { fireEvent, screen } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks'
import { NotFoundScreen } from './NotFoundScreen'

const mockReplace = jest.fn()
const mockParams: { 'not-found'?: string | string[] } = {}

jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
  useLocalSearchParams: () => mockParams,
}))

const TITLE = 'Страница не найдена'
const HOME_BUTTON_TITLE = 'На главный экран'
const UNMATCHED_PATH = '/foo/bar'

describe('<NotFoundScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    delete mockParams['not-found']
  })

  test('renders the title, the unmatched path and the home button', async () => {
    mockParams['not-found'] = ['foo', 'bar']

    await renderWithProviders(<NotFoundScreen />)

    expect(screen.getByText(TITLE)).toBeTruthy()
    expect(screen.getByText(UNMATCHED_PATH)).toBeTruthy()
    expect(screen.getByRole('button', { name: HOME_BUTTON_TITLE })).toBeTruthy()
  })

  test('omits the path when no unmatched segments are provided', async () => {
    await renderWithProviders(<NotFoundScreen />)

    expect(screen.getByText(TITLE)).toBeTruthy()
    expect(screen.queryByText(UNMATCHED_PATH)).toBeNull()
  })

  test('navigates to the listen tab when the home button is pressed', async () => {
    await renderWithProviders(<NotFoundScreen />)

    fireEvent.press(screen.getByRole('button', { name: HOME_BUTTON_TITLE }))

    expect(mockReplace).toHaveBeenCalledWith('/listen')
  })
})

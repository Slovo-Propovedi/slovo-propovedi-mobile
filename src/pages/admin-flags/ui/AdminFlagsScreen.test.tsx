import { fireEvent } from '@testing-library/react-native'
import { featureFlagsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { AdminFlagsScreen } from './AdminFlagsScreen'

// MarqueeText renders the title twice (visible + measurer), so a single-Text
// stub keeps text queries unambiguous in list-row tests.
jest.mock('shared/ui/marquee-text/marquee-text', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    MarqueeText: ({ testID, text }: { testID?: string; text: string }) => (
      <Text testID={testID}>{text}</Text>
    ),
  }
})

const mockFindAll = jest.fn()
const mockPush = jest.fn()

jest.mock('shared/api', () => ({
  featureFlagsApi: {
    getFeatureFlags: () => ({ featureFlagsControllerFindAll: mockFindAll }),
  },
}))

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => () => void | void) => {
    const { useEffect } = jest.requireActual('react') as {
      useEffect: (effect: () => (() => void) | void, deps: unknown[]) => void
    }
    useEffect(callback, [callback])
  },
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}))

jest.mock('entities/auth', () => ({ useRequireAdminRole: () => undefined }))

const createFlags = (ids: string[]) =>
  featureFlagsMocks.getFeatureFlagsControllerFindAllResponseMock({
    flags: ids.map(id =>
      featureFlagsMocks.getFeatureFlagsControllerCreateResponseMock({
        enabled: id === 'read',
        id,
        key: id,
        title: `Флаг ${id}`,
      }),
    ),
  })

describe('<AdminFlagsScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders flags with key and enabled badge', async () => {
    mockFindAll.mockResolvedValue(createFlags(['read']))

    const { findByText } = await renderWithProviders(<AdminFlagsScreen />)

    expect(await findByText('Флаг read')).toBeTruthy()
    expect(await findByText('read')).toBeTruthy()
    expect(await findByText('Включён')).toBeTruthy()
  })

  test('navigates to the detail screen on row press', async () => {
    mockFindAll.mockResolvedValue(createFlags(['read']))

    const { findByText } = await renderWithProviders(<AdminFlagsScreen />)
    fireEvent.press(await findByText('Флаг read'))

    expect(mockPush).toHaveBeenCalledWith({ params: { id: 'read' }, pathname: '/admin/flags/[id]' })
  })

  test('navigates to the create screen from the header button', async () => {
    mockFindAll.mockResolvedValue(createFlags([]))

    const { findByLabelText, findByText } = await renderWithProviders(<AdminFlagsScreen />)

    expect(await findByText('Флаги')).toBeTruthy()
    fireEvent.press(await findByLabelText('Создать флаг'))

    expect(mockPush).toHaveBeenCalledWith('/admin/flags/create')
  })

  test('shows the empty state when there are no flags', async () => {
    mockFindAll.mockResolvedValue(createFlags([]))

    const { findByText } = await renderWithProviders(<AdminFlagsScreen />)

    expect(await findByText('Флагов пока нет')).toBeTruthy()
  })

  test('shows skeleton rows while the list loads', async () => {
    mockFindAll.mockReturnValue(new Promise(() => undefined))

    const { findAllByTestId, findByText } = await renderWithProviders(<AdminFlagsScreen />)

    expect(await findByText('Флаги')).toBeTruthy()
    expect((await findAllByTestId('admin-skeleton-row')).length).toBeGreaterThan(0)
  })
})

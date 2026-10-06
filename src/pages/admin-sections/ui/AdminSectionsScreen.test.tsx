import { fireEvent, waitFor } from '@testing-library/react-native'
import { sectionsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { AdminSectionsScreen } from './AdminSectionsScreen'

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
const mockReorder = jest.fn()
const mockPush = jest.fn()

jest.mock('shared/api', () => ({
  sectionsApi: {
    getSections: () => ({
      reorderSections: mockReorder,
      sectionControllerFindAll: mockFindAll,
    }),
  },
}))

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => () => void | void) => {
    const { useEffect } = jest.requireActual('react') as {
      useEffect: (effect: () => (() => void) | void, deps: unknown[]) => void
    }
    useEffect(callback, [callback])
  },
  useRouter: () => ({ push: mockPush }),
}))

// DraggableFlatList is a pure-JS reanimated list; a FlatList passthrough keeps
// the row rendering under test without dragging internals.
jest.mock('react-native-draggable-flatlist', () => {
  const { FlatList } = jest.requireActual('react-native')

  return { __esModule: true, default: FlatList }
})

const createSection = () =>
  sectionsMocks.getSectionControllerFindOneResponseMock({
    description: null,
    itemsSize: 'large',
    playlists: [],
    title: 'Первый',
    transform: 'high',
  })

describe('<AdminSectionsScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindAll.mockResolvedValue({
      count: 1,
      sections: [createSection()],
    })
  })

  test('renders fetched sections with their badges', async () => {
    const { findByText, getByText } = await renderWithProviders(<AdminSectionsScreen />)

    expect(await findByText('Первый')).toBeTruthy()
    expect(getByText('Большой')).toBeTruthy()
    expect(getByText('Высокий')).toBeTruthy()
  })

  test('navigates to the detail screen on row press', async () => {
    const { findByText } = await renderWithProviders(<AdminSectionsScreen />)

    fireEvent.press(await findByText('Первый'))

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        params: { id: expect.any(String) },
        pathname: '/admin/sections/[id]',
      }),
    )
  })

  test('navigates to the create screen from the header button', async () => {
    const { findByText } = await renderWithProviders(<AdminSectionsScreen />)

    fireEvent.press(await findByText('Создать раздел'))

    expect(mockPush).toHaveBeenCalledWith('/admin/sections/create')
  })
})

import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { type TestInstance } from 'test-renderer'
import { sectionsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { themeModeAtom } from 'shared/ui/theme'
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

const SCROLL_HOST_TYPES = new Set(['RCTScrollView', 'ScrollView'])
const CREATE_BUTTON_LABEL = 'Создать раздел'

const findRefreshControl = (element: TestInstance) => {
  let current: null | TestInstance = element

  while (current !== null) {
    if (SCROLL_HOST_TYPES.has(String(current.type))) return current.props.refreshControl
    current = current.parent
  }

  throw new Error('Expected a scroll host ancestor, none found')
}

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

    fireEvent.press(await findByText(CREATE_BUTTON_LABEL))

    expect(mockPush).toHaveBeenCalledWith('/admin/sections/create')
  })

  test('reloads sections when pulled to refresh', async () => {
    const { findByText } = await renderWithProviders(<AdminSectionsScreen />)
    const refreshControl = findRefreshControl(await findByText('Первый'))

    await act(async () => {
      await refreshControl.props.onRefresh()
    })

    await waitFor(() => expect(mockFindAll).toHaveBeenCalledTimes(2))
  })

  test('keeps the create button label white in the light theme', async () => {
    const { findByText } = await renderWithProviders(<AdminSectionsScreen />)

    const label = await findByText(CREATE_BUTTON_LABEL)

    expect(StyleSheet.flatten(label.props.style)).toMatchObject({ color: '#fff' })
  })

  test('uses a black create button label in the dark theme', async () => {
    const { ctx, findByText } = await renderWithProviders(<AdminSectionsScreen />)
    await findByText(CREATE_BUTTON_LABEL)

    await act(async () => {
      themeModeAtom(ctx, 'dark')
    })

    const label = await findByText(CREATE_BUTTON_LABEL)

    expect(StyleSheet.flatten(label.props.style)).toMatchObject({ color: '#000' })
  })
})

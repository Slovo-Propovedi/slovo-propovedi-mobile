import { type PropsWithChildren, type ReactNode } from 'react'
import { renderWithProviders } from 'shared/mocks'
import Layout from '../../../app/(tabs)/_layout'

// Controls whether the navigator renders the tabBar element at all, so a test
// can prove the search gate and the player are composed INSIDE it.
let mockIsTabBarInvoked = true

// The real SearchGate pulls the player entity and the whole navigation guard
// stack; the layout test only verifies that the overlay is wired into the tab
// layout, so it is mocked with a marker like the other heavy chrome widgets.
jest.mock('pages/search', () => {
  const { Text } = jest.requireActual('react-native')

  return { SearchGate: () => <Text>SEARCH_GATE</Text> }
})

jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native')

  const Screen = ({ name }: { name: string }) => <Text>{name}</Text>
  const Tabs = ({ children, tabBar }: PropsWithChildren<{ tabBar?: () => ReactNode }>) => (
    <>
      {children}
      {mockIsTabBarInvoked && tabBar?.()}
    </>
  )

  return {
    Tabs: Object.assign(Tabs, { Screen }),
    usePathname: jest.fn(() => '/listen'),
  }
})

jest.mock('pages/playlist', () => ({ PlaylistSheetMenu: () => null }))
jest.mock('widgets/expandable-player', () => {
  const { Text } = jest.requireActual('react-native')

  return { ExpandablePlayer: () => <Text>PLAYER</Text> }
})
jest.mock('widgets/tab-bar', () => {
  const { Text } = jest.requireActual('react-native')

  return { CustomTabBar: () => <Text>TAB_BAR</Text> }
})

describe('(tabs) layout', () => {
  beforeEach(() => {
    mockIsTabBarInvoked = true
  })

  test('declares the three tab screens and mounts the floating chrome once', async () => {
    const { getAllByText, getByText } = await renderWithProviders(<Layout />)

    expect(getByText('listen')).toBeTruthy()
    expect(getByText('read')).toBeTruthy()
    expect(getByText('more')).toBeTruthy()
    expect(getAllByText('TAB_BAR')).toHaveLength(1)
    expect(getAllByText('PLAYER')).toHaveLength(1)
    expect(getAllByText('SEARCH_GATE')).toHaveLength(1)
  })

  test('mounts the search gate and the player only inside the tabBar element', async () => {
    mockIsTabBarInvoked = false

    const { queryByText } = await renderWithProviders(<Layout />)

    expect(queryByText('SEARCH_GATE')).toBeNull()
    expect(queryByText('TAB_BAR')).toBeNull()
    expect(queryByText('PLAYER')).toBeNull()
  })
})

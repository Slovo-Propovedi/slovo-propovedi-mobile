import { type PropsWithChildren, type ReactNode } from 'react'
import { renderWithProviders } from 'shared/mocks'
import Layout from '../../../app/(tabs)/_layout'

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
      {tabBar?.()}
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
  test('declares the three tab screens and mounts the floating chrome once', async () => {
    const { getAllByText, getByText } = await renderWithProviders(<Layout />)

    expect(getByText('listen')).toBeTruthy()
    expect(getByText('read')).toBeTruthy()
    expect(getByText('more')).toBeTruthy()
    expect(getAllByText('TAB_BAR')).toHaveLength(1)
    expect(getAllByText('PLAYER')).toHaveLength(1)
    expect(getAllByText('SEARCH_GATE')).toHaveLength(1)
  })
})

import { type PropsWithChildren, type ReactNode } from 'react'
import { renderWithProviders } from 'shared/mocks'
import Layout from '../../../app/(tabs)/_layout'

// Controls whether the navigator renders the tabBar element at all, so a test
// can prove the tab bar and the player are composed INSIDE it.
let mockIsTabBarInvoked = true

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

  test('registers the search route alongside the three visible tabs', async () => {
    const { getByText } = await renderWithProviders(<Layout />)

    // `search` must stay registered (it owns its nested detail stack), while the
    // custom bar hides it from the three tab slots.
    expect(getByText('listen')).toBeTruthy()
    expect(getByText('search')).toBeTruthy()
    expect(getByText('read')).toBeTruthy()
    expect(getByText('more')).toBeTruthy()
    expect(getByText('TAB_BAR')).toBeTruthy()
    expect(getByText('PLAYER')).toBeTruthy()
  })

  test('mounts the tab bar and the player only inside the tabBar element', async () => {
    mockIsTabBarInvoked = false

    const { queryByText } = await renderWithProviders(<Layout />)

    expect(queryByText('TAB_BAR')).toBeNull()
    expect(queryByText('PLAYER')).toBeNull()
  })
})

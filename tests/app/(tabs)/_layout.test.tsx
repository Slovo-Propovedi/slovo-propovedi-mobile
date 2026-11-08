import { type PropsWithChildren, type ReactNode } from 'react'
import { renderWithProviders } from 'shared/mocks'
import Layout from '../../../app/(tabs)/_layout'

jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native')

  const Screen = ({ name }: { name: string }) => <Text>{name}</Text>
  const Tabs = ({
    children,
    tabBar,
  }: PropsWithChildren<{ tabBar?: () => ReactNode }>) => (
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
  test('declares the four tab screens and mounts the floating chrome once', async () => {
    const { getAllByText, getByText } = await renderWithProviders(<Layout />)

    expect(getByText('listen')).toBeTruthy()
    expect(getByText('read')).toBeTruthy()
    expect(getByText('study')).toBeTruthy()
    expect(getByText('more')).toBeTruthy()
    expect(getAllByText('TAB_BAR')).toHaveLength(1)
    expect(getAllByText('PLAYER')).toHaveLength(1)
  })
})

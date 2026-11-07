import { type PropsWithChildren } from 'react'
import { renderWithProviders } from 'shared/mocks'
import Layout from '../../../app/(tabs)/_layout'

jest.mock('expo-router', () => {
  const Screen = () => null

  return {
    Tabs: Object.assign(({ children }: PropsWithChildren) => children, { Screen }),
  }
})

jest.mock('pages/playlist', () => ({ PlaylistSheetMenu: () => null }))
jest.mock('widgets/expandable-player', () => ({ ExpandablePlayer: () => null }))
jest.mock('widgets/tab-bar', () => ({ CustomTabBar: () => null }))
jest.mock('widgets/search-island', () => {
  const { Text } = jest.requireActual('react-native')

  return { SearchIsland: () => <Text>SEARCH_ISLAND</Text> }
})

describe('(tabs) layout', () => {
  test('mounts the global search island once for every tab screen', async () => {
    const { getAllByText, getByText } = await renderWithProviders(<Layout />)

    expect(getByText('SEARCH_ISLAND')).toBeTruthy()
    expect(getAllByText('SEARCH_ISLAND')).toHaveLength(1)
  })
})

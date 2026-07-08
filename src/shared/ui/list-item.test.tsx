import { screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { renderWithProviders } from '../mocks/renderWithProviders'
import { ListItem } from './list-item/list-item'

const titleStub = 'test'

const artworkStub = 'google.com'

describe('<TouchableListItem>', () => {
  test('if data defined return View', async () => {
    await renderWithProviders(<ListItem data={{ artwork: artworkStub, title: titleStub }} />)

    const tree = screen.toJSON()

    if (!tree || Array.isArray(tree)) return

    expect(tree.type).toEqual('View')
  })

  test('if title prop defined title element equals title prop', async () => {
    await renderWithProviders(<ListItem data={{ artwork: artworkStub, title: titleStub }} />)

    const title = screen.getByTestId('title')

    expect(title).toHaveTextContent(titleStub)
  })

  test('displayed preview if artwork in data is defined', async () => {
    await renderWithProviders(<ListItem data={{ artwork: artworkStub, title: titleStub }} />)

    const preview = screen.queryByTestId('preview')

    expect(preview).not.toBeNull()
    expect(preview?.type).toEqual('Image')
  })
})

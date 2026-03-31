import { render, screen } from '@testing-library/react-native'
import { ListItem } from './list-item/list-item'
import '@testing-library/jest-native/extend-expect'

const titleStub = 'test'

const artworkStub = 'google.com'

describe('<TouchableListItem>', () => {
  test('if data defined return View', () => {
    render(<ListItem data={{ artwork: artworkStub, title: titleStub }} />)

    const tree = screen.toJSON()

    if (!tree || Array.isArray(tree)) return

    expect(tree.type).toEqual('View')
  })

  test('if title prop defined title element equals title prop', () => {
    render(<ListItem data={{ artwork: artworkStub, title: titleStub }} />)

    const title = screen.getByTestId('title')

    expect(title).toHaveTextContent(titleStub)
  })

  test('displayed preview if artwork in data is defined', () => {
    render(<ListItem data={{ artwork: artworkStub, title: titleStub }} />)

    const preview = screen.queryByTestId('preview')

    expect(preview).not.toBeNull()
    expect(preview?.type).toEqual('Image')
  })
})

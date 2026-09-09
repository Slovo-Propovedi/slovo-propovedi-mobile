import { screen } from '@testing-library/react-native'
import { APP_ICON_URI as IMAGE_PLACEHOLDER } from 'shared/lib/app-icon'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { ListItem } from '../list-item/list-item'

const titleStub = 'test'

const artworkStub = 'google.com'

describe('<TouchableListItem>', () => {
  test('if data defined renders title', async () => {
    await renderWithProviders(<ListItem data={{ artwork: artworkStub, title: titleStub }} />)

    const title = screen.getByTestId('title')

    expect(title).toBeTruthy()
    expect(title.type).toEqual('Text')
  })

  test('if title prop defined title element equals title prop', async () => {
    await renderWithProviders(<ListItem data={{ artwork: artworkStub, title: titleStub }} />)

    const title = screen.getByTestId('title')

    expect(title).toHaveTextContent(titleStub, { exact: false })
  })

  test('displayed preview if artwork in data is defined', async () => {
    await renderWithProviders(<ListItem data={{ artwork: artworkStub, title: titleStub }} />)

    const preview = screen.queryByTestId('preview')

    expect(preview).not.toBeNull()
    expect(preview?.props.source).toEqual({ uri: artworkStub })
  })

  test('uses IMAGE_PLACEHOLDER if artwork is empty string', async () => {
    await renderWithProviders(<ListItem data={{ artwork: '', title: titleStub }} />)

    const preview = screen.getByTestId('preview')

    expect(preview.props.source).toEqual({ uri: IMAGE_PLACEHOLDER })
  })
})

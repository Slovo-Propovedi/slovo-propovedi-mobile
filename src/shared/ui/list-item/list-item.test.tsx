import { act, screen } from '@testing-library/react-native'
import { APP_ICON_URI as IMAGE_PLACEHOLDER } from '../../lib/app-icon'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { ListItem } from '../list-item/list-item'
import { ListItemSize } from '../list-item/list-item.types'

const titleStub = 'test'

const artworkStub = 'google.com'
let mockWindowWidth = 400
let mockWindowHeight = 800

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ fontScale: 1, height: mockWindowHeight, width: mockWindowWidth }),
}))

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

  test('re-sizes the middle preview when the window resizes', async () => {
    mockWindowWidth = 400
    mockWindowHeight = 800
    const renderItem = () => (
      <ListItem size={ListItemSize.Middle} data={{ artwork: artworkStub, title: titleStub }} />
    )
    const { rerender } = await renderWithProviders(renderItem())

    expect(screen.getByTestId('preview-or-counter')).toHaveStyle({ height: 100, width: 100 })

    mockWindowWidth = 600
    await act(async () => {
      await rerender(renderItem())
    })

    expect(screen.getByTestId('preview-or-counter')).toHaveStyle({ height: 150, width: 150 })
  })
})

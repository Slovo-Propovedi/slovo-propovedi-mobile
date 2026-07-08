import { fireEvent, screen } from '@testing-library/react-native'
import { renderWithProviders } from '../mocks/renderWithProviders'
import { TouchableListItem } from './touchable-list-item'

const dataStub = {
  artwork: 'google.com',
  title: 'test',
}

const mockFunction = jest.fn()

describe('<TouchableListItem/>', () => {
  beforeEach(() => {
    mockFunction.mockClear()
  })

  test('rendered View in the container', async () => {
    await renderWithProviders(<TouchableListItem data={dataStub} onPress={() => null} />)

    const listItem = screen.getByTestId('list-item')

    expect(listItem.type).toEqual('View')
  })

  test('not called mock function if not touch on item', async () => {
    await renderWithProviders(<TouchableListItem data={dataStub} onPress={mockFunction} />)

    expect(mockFunction).not.toHaveBeenCalled()
  })

  test('mock function is called if touch on item', async () => {
    await renderWithProviders(<TouchableListItem data={dataStub} onPress={mockFunction} />)

    fireEvent.press(screen.getByTestId('container'))

    expect(mockFunction).toHaveBeenCalled()
    expect(mockFunction).toHaveBeenCalledTimes(1)
  })
})

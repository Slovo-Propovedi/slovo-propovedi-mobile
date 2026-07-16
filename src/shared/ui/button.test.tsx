import { fireEvent, screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { Button } from './button'

const titleStub = 'Press Me'

describe('<Button>', () => {
  test('renders the title text correctly', async () => {
    await renderWithProviders(<Button title={titleStub} />)

    const title = screen.getByText(titleStub)

    expect(title).toBeTruthy()
    expect(title).toHaveTextContent(titleStub)
  })

  test('calls onPress when pressed', async () => {
    const onPressMock = jest.fn()

    await renderWithProviders(<Button title={titleStub} onPress={onPressMock} />)

    fireEvent.press(screen.getByText(titleStub))

    expect(onPressMock).toHaveBeenCalledTimes(1)
  })

  test('is disabled when disabled prop is true', async () => {
    await renderWithProviders(<Button disabled title={titleStub} />)

    const button = screen.getByText(titleStub).parent

    expect(button).toBeDisabled()
  })

  test('does not call onPress when disabled', async () => {
    const onPressMock = jest.fn()

    await renderWithProviders(<Button disabled title={titleStub} onPress={onPressMock} />)

    fireEvent.press(screen.getByText(titleStub))

    expect(onPressMock).not.toHaveBeenCalled()
  })

  test('applies default button styles', async () => {
    await renderWithProviders(<Button title={titleStub} />)

    const title = screen.getByText(titleStub)
    const button = title.parent

    expect(button).toHaveStyle({ backgroundColor: 'blue' })
  })

  test('applies disabled background color when disabled', async () => {
    await renderWithProviders(<Button disabled title={titleStub} />)

    const title = screen.getByText(titleStub)
    const button = title.parent

    expect(button).toHaveStyle({ backgroundColor: '#d3d3d3' })
  })

  test('applies custom style prop', async () => {
    await renderWithProviders(<Button title={titleStub} style={{ backgroundColor: 'red' }} />)

    const title = screen.getByText(titleStub)
    const button = title.parent

    expect(button).toHaveStyle({ backgroundColor: 'red' })
  })

  test('applies titleStyle prop to text', async () => {
    await renderWithProviders(<Button title={titleStub} titleStyle={{ fontSize: 20 }} />)

    const title = screen.getByText(titleStub)

    expect(title).toHaveStyle({ fontSize: 20 })
  })

  test('applies color prop to text', async () => {
    await renderWithProviders(<Button color='green' title={titleStub} />)

    const title = screen.getByText(titleStub)

    expect(title).toHaveStyle({ color: 'green' })
  })
})

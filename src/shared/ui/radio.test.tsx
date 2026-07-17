import { fireEvent, screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { RadioButton } from './radio'

const labelStub = 'Option One'

const defaultProps = {
  label: labelStub,
  onValueChange: jest.fn(),
  selected: false,
}

describe('<RadioButton>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders the label text', async () => {
    await renderWithProviders(<RadioButton {...defaultProps} />)

    expect(screen.getByText(labelStub)).toBeTruthy()
  })

  test('calls onValueChange with true when pressed and selected is false', async () => {
    const onValueChange = jest.fn()

    await renderWithProviders(
      <RadioButton selected={false} label={labelStub} onValueChange={onValueChange} />,
    )

    fireEvent.press(screen.getByRole('button'))

    expect(onValueChange).toHaveBeenCalledWith(true)
  })

  test('calls onValueChange with false when pressed and selected is true', async () => {
    const onValueChange = jest.fn()

    await renderWithProviders(
      <RadioButton selected={true} label={labelStub} onValueChange={onValueChange} />,
    )

    fireEvent.press(screen.getByRole('button'))

    expect(onValueChange).toHaveBeenCalledWith(false)
  })

  test('does not call onValueChange when disabled', async () => {
    const onValueChange = jest.fn()

    await renderWithProviders(
      <RadioButton disabled selected={false} label={labelStub} onValueChange={onValueChange} />,
    )

    fireEvent.press(screen.getByRole('button'))

    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('renders without label when label is empty string', async () => {
    const { queryByText } = await renderWithProviders(<RadioButton {...defaultProps} label='' />)

    expect(queryByText(labelStub)).toBeNull()
    expect(screen.getByRole('button')).toBeTruthy()
  })
})

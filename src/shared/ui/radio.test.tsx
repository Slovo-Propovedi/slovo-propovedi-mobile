import { fireEvent, render, screen } from '@testing-library/react-native'
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
    await render(<RadioButton {...defaultProps} />)

    expect(screen.getByText(labelStub)).toBeTruthy()
  })

  test('calls onValueChange with true when pressed and selected is false', async () => {
    const onValueChange = jest.fn()

    await render(<RadioButton selected={false} label={labelStub} onValueChange={onValueChange} />)

    await fireEvent.press(screen.getByRole('button'))

    expect(onValueChange).toHaveBeenCalledWith(true)
  })

  test('calls onValueChange with false when pressed and selected is true', async () => {
    const onValueChange = jest.fn()

    await render(<RadioButton selected={true} label={labelStub} onValueChange={onValueChange} />)

    await fireEvent.press(screen.getByRole('button'))

    expect(onValueChange).toHaveBeenCalledWith(false)
  })

  test('does not call onValueChange when disabled', async () => {
    const onValueChange = jest.fn()

    await render(
      <RadioButton disabled selected={false} label={labelStub} onValueChange={onValueChange} />,
    )

    await fireEvent.press(screen.getByRole('button'))

    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('renders without label when label is empty string', async () => {
    const { queryByText } = await render(<RadioButton {...defaultProps} label='' />)

    expect(queryByText(labelStub)).toBeNull()
    expect(screen.getByRole('button')).toBeTruthy()
  })
})

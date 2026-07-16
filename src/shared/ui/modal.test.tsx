import { fireEvent, screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { Text } from 'react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { Modal } from './modal'

const CHILDREN_TEXT = 'Modal Content'
const onBackdropPressMock = jest.fn()

describe('<Modal>', () => {
  beforeEach(() => {
    onBackdropPressMock.mockClear()
  })

  test('renders children when visible is true', async () => {
    await renderWithProviders(
      <Modal visible onBackdropPress={onBackdropPressMock}>
        <Text>{CHILDREN_TEXT}</Text>
      </Modal>,
    )

    const content = screen.getByText(CHILDREN_TEXT)

    expect(content).toBeTruthy()
  })

  test('calls onBackdropPress when backdrop is pressed', async () => {
    await renderWithProviders(
      <Modal visible onBackdropPress={onBackdropPressMock}>
        <Text>{CHILDREN_TEXT}</Text>
      </Modal>,
    )

    fireEvent.press(screen.getByRole('button'))

    expect(onBackdropPressMock).toHaveBeenCalledTimes(1)
  })

  test('does not render children when visible is false', async () => {
    await renderWithProviders(
      <Modal visible={false} onBackdropPress={onBackdropPressMock}>
        <Text>{CHILDREN_TEXT}</Text>
      </Modal>,
    )

    expect(screen.queryByText(CHILDREN_TEXT)).toBeNull()
  })
})

import { fireEvent, screen } from '@testing-library/react-native'
import { Pressable, StyleSheet, Text } from 'react-native'
import { renderWithProviders } from '../../mocks'
import { FormScrollView } from './FormScrollView'
import { useFormSubmit } from './formSubmitContext'

let mockBottomInset = 0

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context')

  return {
    ...actual,
    useSafeAreaInsets: () => ({ bottom: mockBottomInset, left: 0, right: 0, top: 0 }),
  }
})

const SCROLL_TEST_ID = 'form-scroll-view'

const getContentContainerStyle = () =>
  StyleSheet.flatten(screen.getByTestId(SCROLL_TEST_ID).props.contentContainerStyle)

const SubmitConsumer = () => {
  const onSubmit = useFormSubmit()

  return (
    <Pressable onPress={() => onSubmit?.()} accessibilityLabel='invoke-submit'>
      <Text>{onSubmit ? 'wired' : 'inert'}</Text>
    </Pressable>
  )
}

describe('<FormScrollView>', () => {
  test('publishes onSubmit to child fields', async () => {
    const onSubmit = jest.fn()
    const { getByLabelText, getByText } = await renderWithProviders(
      <FormScrollView onSubmit={onSubmit}>
        <SubmitConsumer />
      </FormScrollView>,
    )

    expect(getByText('wired')).toBeTruthy()
    fireEvent.press(getByLabelText('invoke-submit'))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  test('leaves the submit context empty without onSubmit', async () => {
    const { getByText } = await renderWithProviders(
      <FormScrollView>
        <SubmitConsumer />
      </FormScrollView>,
    )

    expect(getByText('inert')).toBeTruthy()
  })

  test('adds the bottom safe-area inset to the consumer bottom padding', async () => {
    mockBottomInset = 20

    try {
      await renderWithProviders(
        <FormScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <SubmitConsumer />
        </FormScrollView>,
      )

      expect(getContentContainerStyle()).toMatchObject({ padding: 16, paddingBottom: 44 })
    } finally {
      mockBottomInset = 0
    }
  })

  test('reserves the bottom safe-area inset without consumer padding', async () => {
    mockBottomInset = 34

    try {
      await renderWithProviders(
        <FormScrollView>
          <SubmitConsumer />
        </FormScrollView>,
      )

      expect(getContentContainerStyle()).toMatchObject({ paddingBottom: 34 })
    } finally {
      mockBottomInset = 0
    }
  })
})

import { act, fireEvent, screen } from '@testing-library/react-native'
import { Platform, Text } from 'react-native'
import { createKeyDownEvent, installFakeDom } from 'shared/lib/testing'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { Modal } from './modal'

const BACKDROP_TEST_ID = 'modal-backdrop'
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

  test('backdrop is a role-less pressable that closes on press', async () => {
    await renderWithProviders(
      <Modal visible onBackdropPress={onBackdropPressMock}>
        <Text>{CHILDREN_TEXT}</Text>
      </Modal>,
    )

    expect(screen.queryByRole('button')).toBeNull()

    fireEvent.press(screen.getByTestId(BACKDROP_TEST_ID))

    expect(onBackdropPressMock).toHaveBeenCalledTimes(1)
  })

  test('backdrop is not keyboard-focusable', async () => {
    await renderWithProviders(
      <Modal visible onBackdropPress={onBackdropPressMock}>
        <Text>{CHILDREN_TEXT}</Text>
      </Modal>,
    )

    expect(screen.getByTestId(BACKDROP_TEST_ID).props.tabIndex).toBe(-1)
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

describe('<Modal> web Escape handling', () => {
  beforeEach(() => {
    onBackdropPressMock.mockClear()
  })

  test('Escape on web closes the modal via onBackdropPress', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      await renderWithProviders(
        <Modal visible onBackdropPress={onBackdropPressMock}>
          <Text>{CHILDREN_TEXT}</Text>
        </Modal>,
      )

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape'))
      })

      expect(onBackdropPressMock).toHaveBeenCalledTimes(1)
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('Escape handler stops propagation so the player does not also collapse', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      await renderWithProviders(
        <Modal visible onBackdropPress={onBackdropPressMock}>
          <Text>{CHILDREN_TEXT}</Text>
        </Modal>,
      )

      const event = createKeyDownEvent('Escape')
      await act(async () => {
        dispatchKeyDown(event)
      })

      expect(event.stopPropagation).toHaveBeenCalledTimes(1)
      expect(onBackdropPressMock).toHaveBeenCalledTimes(1)
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('Escape with a modifier held does not close the modal', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      await renderWithProviders(
        <Modal visible onBackdropPress={onBackdropPressMock}>
          <Text>{CHILDREN_TEXT}</Text>
        </Modal>,
      )

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape', { ctrlKey: true }))
      })

      expect(onBackdropPressMock).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('Escape on native does not attach a keydown listener', async () => {
    const { dispatchKeyDown, getListenerCount, restore } = installFakeDom()
    try {
      await renderWithProviders(
        <Modal visible onBackdropPress={onBackdropPressMock}>
          <Text>{CHILDREN_TEXT}</Text>
        </Modal>,
      )

      expect(getListenerCount()).toBe(0)

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape'))
      })

      expect(onBackdropPressMock).not.toHaveBeenCalled()
    } finally {
      restore()
    }
  })

  test('removes the keydown listener when the modal hides and on unmount', async () => {
    const { getListenerCount, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const { rerender, unmount } = await renderWithProviders(
        <Modal visible onBackdropPress={onBackdropPressMock}>
          <Text>{CHILDREN_TEXT}</Text>
        </Modal>,
      )

      expect(getListenerCount()).toBe(1)

      await rerender(
        <Modal visible={false} onBackdropPress={onBackdropPressMock}>
          <Text>{CHILDREN_TEXT}</Text>
        </Modal>,
      )

      expect(getListenerCount()).toBe(0)

      await rerender(
        <Modal visible onBackdropPress={onBackdropPressMock}>
          <Text>{CHILDREN_TEXT}</Text>
        </Modal>,
      )

      expect(getListenerCount()).toBe(1)

      await act(async () => {
        unmount()
      })

      expect(getListenerCount()).toBe(0)
    } finally {
      restorePlatform.restore()
      restore()
    }
  })
})

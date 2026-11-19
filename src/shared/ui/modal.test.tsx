import { createCtx } from '@reatom/framework'
import { act, fireEvent, screen } from '@testing-library/react-native'
import { Platform, StyleSheet, Text } from 'react-native'
import { type TestInstance } from 'test-renderer'
import { createKeyDownEvent } from '../lib/testing/createKeyEvent'
import { installFakeDom } from '../lib/testing/installFakeDom'
import { renderWithProviders } from '../mocks/renderWithProviders'
import { toastAtom } from '../model/toast'
import { Modal } from './modal'

// Platform.OS is read once at module load, so the cap can't be toggled by
// replaceProperty; pin the constant to a numeric value to assert it is applied.
const DESKTOP_COLUMN_WIDTH = 600
jest.mock('./layout/appMaxWidth', () => ({ APP_MAX_CONTENT_WIDTH: DESKTOP_COLUMN_WIDTH }))

const BACKDROP_TEST_ID = 'modal-backdrop'
const CHILDREN_TEXT = 'Modal Content'
const TOAST_MESSAGE = 'Ссылка скопирована'
const onBackdropPressMock = jest.fn()

const isDescendantOf = (element: TestInstance, ancestor: TestInstance): boolean => {
  let current: null | TestInstance = element.parent

  while (current !== null) {
    if (current === ancestor) return true
    current = current.parent
  }

  return false
}

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

  test('content is a sibling of the backdrop, so a press inside does not close the modal', async () => {
    await renderWithProviders(
      <Modal visible onBackdropPress={onBackdropPressMock}>
        <Text>{CHILDREN_TEXT}</Text>
      </Modal>,
    )

    const content = screen.getByText(CHILDREN_TEXT)
    const backdrop = screen.getByTestId(BACKDROP_TEST_ID)

    // The regression guard: as a child of the backdrop Pressable, every in-dialog
    // press bubbled up and closed the modal (web TextInput focus).
    expect(isDescendantOf(content, backdrop)).toBe(false)

    fireEvent.press(content)

    expect(onBackdropPressMock).not.toHaveBeenCalled()
  })

  test('does not render children when visible is false', async () => {
    await renderWithProviders(
      <Modal visible={false} onBackdropPress={onBackdropPressMock}>
        <Text>{CHILDREN_TEXT}</Text>
      </Modal>,
    )

    expect(screen.queryByText(CHILDREN_TEXT)).toBeNull()
  })

  test('content container is capped to the shared desktop column width', async () => {
    await renderWithProviders(
      <Modal visible onBackdropPress={onBackdropPressMock}>
        <Text>{CHILDREN_TEXT}</Text>
      </Modal>,
    )

    const contentContainer = screen.getByText(CHILDREN_TEXT).parent
    const style = StyleSheet.flatten(contentContainer?.props.style)

    expect(style.maxWidth).toBe(DESKTOP_COLUMN_WIDTH)
    expect(style.width).toBe('100%')
    expect(style.alignSelf).toBe('center')
  })
})

describe('<Modal> toast overlay', () => {
  test('mounts the toast beside the backdrop so it paints above the dialog', async () => {
    const ctx = createCtx()
    toastAtom(ctx, TOAST_MESSAGE)

    await renderWithProviders(
      <Modal visible onBackdropPress={onBackdropPressMock}>
        <Text>{CHILDREN_TEXT}</Text>
      </Modal>,
      { ctx },
    )

    const toast = screen.getByText(TOAST_MESSAGE).parent
    const backdropPressable = screen.getByTestId(BACKDROP_TEST_ID)

    if (toast === null) throw new Error('toast must be mounted inside the modal')

    expect(toast.props.accessibilityRole).toBe('alert')
    // A native modal window paints above the app root, where the other Toast
    // lives; this one must sit in the modal root, outside the dialog content.
    expect(isDescendantOf(toast, backdropPressable)).toBe(false)
    expect(toast.parent).toBe(backdropPressable.parent?.parent)
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

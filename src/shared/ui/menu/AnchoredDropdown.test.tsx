import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { createRef } from 'react'
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native'
import { createKeyDownEvent, installFakeDom } from 'shared/lib/testing'
import { AnchoredDropdown } from './AnchoredDropdown'

const BACKDROP_TEST_ID = 'anchored-dropdown-backdrop'
const MENU_TEST_ID = 'anchored-dropdown-menu'
const WINDOW_HEIGHT = 844
const WINDOW_WIDTH = 390

const baseAnchor = { height: 36, width: 44, x: 300, y: 500 }

const renderMenu = async (props?: Partial<React.ComponentProps<typeof AnchoredDropdown>>) => {
  await render(
    <AnchoredDropdown
      visible
      anchor={baseAnchor}
      onClose={jest.fn()}
      testID={MENU_TEST_ID}
      {...props}
    >
      <Text>Menu item</Text>
    </AnchoredDropdown>,
  )
}

const measureMenu = async (height = 100) => {
  await fireEvent(screen.getByTestId(MENU_TEST_ID), 'layout', {
    nativeEvent: { layout: { height, width: 160, x: 0, y: 0 } },
  })
}

const getMenuStyle = () => StyleSheet.flatten(screen.getByTestId(MENU_TEST_ID).props.style)

describe('<AnchoredDropdown>', () => {
  beforeEach(() => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({
      fontScale: 1,
      height: WINDOW_HEIGHT,
      scale: 1,
      width: WINDOW_WIDTH,
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders nothing when visible is false', async () => {
    await renderMenu({ visible: false })

    expect(screen.queryByTestId(MENU_TEST_ID)).toBeNull()
  })

  test('renders nothing when anchor is null', async () => {
    await renderMenu({ anchor: null })

    expect(screen.queryByTestId(MENU_TEST_ID)).toBeNull()
  })

  test('hides menu until its height is measured', async () => {
    await renderMenu()

    expect(getMenuStyle()).toMatchObject({ opacity: 0, pointerEvents: 'none' })
  })

  test('places menu ABOVE the anchor by default', async () => {
    await renderMenu()

    await measureMenu(100)

    expect(getMenuStyle()).toMatchObject({ right: 46, top: 396 })
  })

  test('flips BELOW when the anchor is near the screen top', async () => {
    await renderMenu({ anchor: { height: 36, width: 44, x: 300, y: 50 } })

    await measureMenu(100)

    expect(getMenuStyle()).toMatchObject({ right: 46, top: 90 })
  })

  test('clamps menu top to the gap at the exact above/below boundary', async () => {
    await renderMenu({ anchor: { height: 36, width: 44, x: 300, y: 104 } })

    await measureMenu(100)

    expect(getMenuStyle()).toMatchObject({ right: 46, top: 4 })
  })

  test('clamps menu top so a tall menu stays inside the window', async () => {
    await renderMenu({ anchor: { height: 36, width: 44, x: 300, y: 500 } })

    await measureMenu(800)

    // 500 < 804 → flips below: 500+36+4 = 540; clamp max = 844-800-4 = 40
    expect(getMenuStyle()).toMatchObject({ top: 40 })
  })

  test('clamps menu right so it stays inside the window on the left edge', async () => {
    await renderMenu({ anchor: { height: 36, width: 44, x: 0, y: 500 } })

    await measureMenu(100)

    // preferredRight = 390-0-44 = 346; clamp max = 390-160-4 = 226
    expect(getMenuStyle()).toMatchObject({ right: 226 })
  })

  test('clamps menu right so it stays inside the window on the right edge', async () => {
    await renderMenu({ anchor: { height: 36, width: 44, x: 346, y: 500 } })

    await measureMenu(100)

    // preferredRight = 390-346-44 = 0; clamp min = 4
    expect(getMenuStyle()).toMatchObject({ right: 4 })
  })

  test('re-anchors to the button when the window resizes', async () => {
    const anchorRef = createRef<View>()
    const measureInWindow = jest
      .spyOn(View.prototype, 'measureInWindow')
      .mockImplementation((cb: (x: number, y: number, width: number, height: number) => void) => {
        cb(300, 500, 44, 36)
        return undefined
      })

    await render(
      <View ref={anchorRef} collapsable={false}>
        <Text>Trigger</Text>
        <AnchoredDropdown
          visible
          anchor={baseAnchor}
          onClose={jest.fn()}
          anchorRef={anchorRef}
          testID={MENU_TEST_ID}
        >
          <Text>Menu item</Text>
        </AnchoredDropdown>
      </View>,
    )
    await measureMenu(100)

    expect(getMenuStyle()).toMatchObject({ right: 46, top: 396 })

    measureInWindow.mockImplementation(
      (cb: (x: number, y: number, width: number, height: number) => void) => {
        cb(150, 300, 44, 36)
        return undefined
      },
    )

    // useWindowDimensions re-syncs from Dimensions.get on every change, so the
    // mock must return the new window before the resize event fires.
    jest.spyOn(Dimensions, 'get').mockReturnValue({
      fontScale: 1,
      height: 900,
      scale: 1,
      width: 500,
    })

    await act(async () => {
      Dimensions.set({
        screen: { fontScale: 1, height: 900, scale: 1, width: 500 },
        window: { fontScale: 1, height: 900, scale: 1, width: 500 },
      })
    })

    // Button moved to x=150, y=300 in a 500×900 window:
    // preferredRight = 500-150-44 = 306; top = 300-100-4 = 196
    expect(getMenuStyle()).toMatchObject({ right: 306, top: 196 })
  })

  test('backdrop press calls onClose', async () => {
    const onClose = jest.fn()
    await renderMenu({ onClose })

    fireEvent.press(screen.getByTestId(BACKDROP_TEST_ID))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('backdrop is not keyboard-focusable', async () => {
    await renderMenu()

    expect(screen.getByTestId(BACKDROP_TEST_ID).props.tabIndex).toBe(-1)
  })
})

describe('<AnchoredDropdown> web Escape handling', () => {
  test('Escape on web closes the dropdown via onClose', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const onClose = jest.fn()
      await renderMenu({ onClose })

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape'))
      })

      expect(onClose).toHaveBeenCalledTimes(1)
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('Escape does not close the dropdown when visible is false', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const onClose = jest.fn()
      await renderMenu({ onClose, visible: false })

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape'))
      })

      expect(onClose).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('Escape with a modifier held does not close the dropdown', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const onClose = jest.fn()
      await renderMenu({ onClose })

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape', { ctrlKey: true }))
      })

      expect(onClose).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('Escape on native does not close the dropdown', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    try {
      const onClose = jest.fn()
      await renderMenu({ onClose })

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape'))
      })

      expect(onClose).not.toHaveBeenCalled()
    } finally {
      restore()
    }
  })
})

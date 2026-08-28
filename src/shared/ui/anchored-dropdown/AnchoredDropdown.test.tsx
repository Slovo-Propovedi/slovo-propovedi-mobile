import { fireEvent, render, screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { Dimensions, StyleSheet, Text } from 'react-native'
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

  test('keeps menu ABOVE at the exact boundary', async () => {
    await renderMenu({ anchor: { height: 36, width: 44, x: 300, y: 104 } })

    await measureMenu(100)

    expect(getMenuStyle()).toMatchObject({ right: 46, top: 0 })
  })

  test('backdrop press calls onClose', async () => {
    const onClose = jest.fn()
    await renderMenu({ onClose })

    fireEvent.press(screen.getByTestId(BACKDROP_TEST_ID))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

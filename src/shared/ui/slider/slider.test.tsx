import { act, fireEvent, screen } from '@testing-library/react-native'
import { type ReactElement } from 'react'
import { StyleSheet, View } from 'react-native'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { RADIUSES } from '../theme/themed'
import { Slider } from './slider'
import { SliderItemSize } from './slider-item/slider-item.types'
import { getSliderCardLayout, getSliderLayoutViewport } from './slider-layout.lib'

const SLIDER_ITEM_ID = 'slider-item'
const BASE_WIDTH = 400

// The window is narrowed so the virtualized slider mounts a preview of the
// columns, not every item. Item geometry stays real because the layout viewport
// is derived from it.
let mockWindowWidth = BASE_WIDTH
let mockWindowHeight = 800

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ fontScale: 1, height: mockWindowHeight, width: mockWindowWidth }),
}))

const fireListLayout = async (width: number) => {
  const list = screen.root?.queryAll(
    instance => instance.props.horizontal === true && typeof instance.props.onLayout === 'function',
  )[0]

  if (!list) throw new Error('slider list not found')

  await fireEvent(list, 'layout', {
    nativeEvent: { layout: { height: 200, width, x: 0, y: 0 } },
  })
}

const renderedCardWidths = () =>
  new Set(
    screen.root
      ?.queryAll(instance => {
        const flat = StyleSheet.flatten(instance.props.style)

        return flat?.borderRadius === RADIUSES.slider && typeof flat?.width === 'number'
      })
      .map(instance => StyleSheet.flatten(instance.props.style).width),
  )

const itemStub = { artwork: 'https//:vk.com', data: {} }
const sliderStub = { items: [itemStub], title: 'title' }
const mockData: { text: null | string } = { text: null }

const createItems = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    artwork: 'https://example.com/image.png',
    data: { id: index },
  }))

const getInitialNumToRender = (size: SliderItemSize) => {
  const layoutViewport = getSliderLayoutViewport(BASE_WIDTH)
  return Math.ceil(layoutViewport / getSliderCardLayout(size, layoutViewport).stride) + 1
}

describe('<Slider/>', () => {
  beforeEach(() => {
    mockData.text = null
    mockWindowWidth = BASE_WIDTH
    mockWindowHeight = 800
  })

  test('return null if items prop is undefined', async () => {
    //@ts-expect-error -- undefined is a not a valid items
    await renderWithProviders(<Slider items={undefined} />)
    expect(screen.queryByTestId(SLIDER_ITEM_ID)).toBeNull()
  })

  test('return null, if items length === 0', async () => {
    await renderWithProviders(<Slider items={[]} />)
    expect(screen.queryByTestId(SLIDER_ITEM_ID)).toBeNull()
  })

  test('return View, if items length > 0', async () => {
    await renderWithProviders(<Slider items={sliderStub.items} />)
    expect(screen.getAllByTestId(SLIDER_ITEM_ID).length).toBeGreaterThan(0)
  })

  test('return 2 slider items, if items length === 2', async () => {
    await renderWithProviders(<Slider items={[itemStub, itemStub]} />)
    expect(screen.getAllByTestId(SLIDER_ITEM_ID).length).toEqual(2)
  })

  test('onPressItem called on press item', async () => {
    await renderWithProviders(
      <Slider
        items={sliderStub.items}
        onPressItem={() => {
          mockData.text = 'done'
        }}
      />,
    )
    fireEvent.press(screen.getAllByTestId('slider-item')[0])
    expect(mockData.text).not.toBeNull()
  })

  test('has Text element, if title is defined', async () => {
    await renderWithProviders(<Slider items={sliderStub.items} title={sliderStub.title} />)
    expect(screen.queryByTestId('title')).not.toBeNull()
  })

  test('content in the Text element equals to title prop', async () => {
    await renderWithProviders(<Slider items={sliderStub.items} title={sliderStub.title} />)
    expect(screen.queryByTestId('title')).toHaveTextContent(sliderStub.title, { exact: false })
  })

  test('wraps the title and keeps the arrow glued inline inside the title text', async () => {
    await renderWithProviders(
      <Slider
        items={sliderStub.items}
        title='Очень длинный заголовок секции, который должен переноситься на несколько строк'
      />,
    )
    const title = screen.getByTestId('title')
    // Заголовок переносится естественно — без numberOfLines и многоточия.
    expect(title.props.numberOfLines).toBeUndefined()
    expect(title.props.ellipsizeMode).toBeUndefined()
    // Стрелка рендерится вложенным инлайн-элементом внутри заголовка — приклеена
    // к тексту, а не вынесена отдельным элементом, который мог бы уехать на свою строку.
    const hasNestedArrow = title.children.some(child => typeof child !== 'string')
    expect(hasNestedArrow).toBe(true)
  })

  test('wraps the section title with renderTitleWrapper when provided', async () => {
    const renderTitleWrapper = jest.fn((title: ReactElement) => (
      <View testID='wrapped-title'>{title}</View>
    ))

    await renderWithProviders(
      <Slider
        items={sliderStub.items}
        title={sliderStub.title}
        renderTitleWrapper={renderTitleWrapper}
      />,
    )

    expect(renderTitleWrapper).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('wrapped-title')).toHaveTextContent(sliderStub.title, {
      exact: false,
    })
  })

  test('call onPressTitle callback, when press on tittle element', async () => {
    await renderWithProviders(
      <Slider
        items={sliderStub.items}
        title={sliderStub.title}
        onPressTitle={() => {
          mockData.text = 'new value'
        }}
      />,
    )
    fireEvent.press(screen.getByTestId('title'))
    expect(mockData.text).toEqual('new value')
  })

  test('renders every item and calls onPressItem with the pressed data in multi-row mode', async () => {
    const pressedItems: { id: number }[] = []
    const items = createItems(5)

    await renderWithProviders(
      <Slider
        items={items}
        itemsRows={2}
        onPressItem={data => {
          pressedItems.push(data)
        }}
      />,
    )

    const renderedItems = screen.getAllByTestId(SLIDER_ITEM_ID)
    expect(renderedItems).toHaveLength(5)

    fireEvent.press(renderedItems[4])
    expect(pressedItems).toEqual([{ id: 4 }])
  })

  test('mounts only a virtualized preview of the items, not all of them', async () => {
    const items = createItems(20)

    await renderWithProviders(<Slider items={items} />)

    const expectedMountedColumns = Math.min(
      getInitialNumToRender(SliderItemSize.Small),
      items.length,
    )
    const renderedItems = screen.getAllByTestId(SLIDER_ITEM_ID)
    expect(renderedItems.length).toBeLessThan(items.length)
    expect(renderedItems.length).toEqual(expectedMountedColumns)
  })

  test('keeps the card size through a rotation: one reflow, no second resizing commit', async () => {
    const items = createItems(6)
    mockWindowWidth = 390
    mockWindowHeight = 844
    const { rerender } = await renderWithProviders(<Slider items={items} />)

    await fireListLayout(390)

    const portraitWidth = getSliderCardLayout(SliderItemSize.Small, 390).cardWidth
    expect(renderedCardWidths()).toEqual(new Set([portraitWidth]))

    mockWindowWidth = 844
    mockWindowHeight = 390
    await act(async () => {
      await rerender(<Slider items={items} />)
    })
    // The list's live width changes on rotation; the frozen base must keep the
    // cards at their portrait size instead of re-deriving a landscape width.
    await fireListLayout(844)

    expect(renderedCardWidths()).toEqual(new Set([portraitWidth]))
  })

  test('clamps the card size to a narrower embedded list', async () => {
    const items = createItems(6)
    mockWindowWidth = 390
    mockWindowHeight = 844
    await renderWithProviders(<Slider items={items} />)

    await fireListLayout(300)

    const embeddedWidth = getSliderCardLayout(SliderItemSize.Small, 300).cardWidth
    expect(renderedCardWidths()).toEqual(new Set([embeddedWidth]))
  })
})

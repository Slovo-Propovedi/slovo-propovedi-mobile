import { fireEvent, screen } from '@testing-library/react-native'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { Slider } from './slider'
import { getSliderItemStride } from './slider-item/slider-item.lib'
import { SliderItemSize } from './slider-item/slider-item.types'

const SLIDER_ITEM_ID = 'slider-item'
const MOCK_SCREEN_WIDTH = 400

// SCREEN_WIDTH is narrowed so the virtualized slider mounts a preview of the
// columns, not every item. Item geometry (SIZE_OF_MINIMUM_SIDE_OF_SCREEN)
// stays real because getSliderItemWidth depends on it. The width is inlined:
// hoisted jest.mock factories cannot reference module-level constants.
jest.mock('shared/config', () => {
  const actual = jest.requireActual('shared/config')
  return { ...actual, SCREEN_WIDTH: 400 }
})

const itemStub = { artwork: 'https//:vk.com', data: {} }
const sliderStub = { items: [itemStub], title: 'title' }
const mockData: { text: null | string } = { text: null }

const createItems = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    artwork: 'https://example.com/image.png',
    data: { id: index },
  }))

const getInitialNumToRender = (size: SliderItemSize) =>
  Math.ceil(MOCK_SCREEN_WIDTH / getSliderItemStride(size)) + 1

describe('<Slider/>', () => {
  beforeEach(() => {
    mockData.text = null
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
})

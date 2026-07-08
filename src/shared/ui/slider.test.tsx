import { fireEvent, screen } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks'
import { Slider } from './slider'
import '@testing-library/jest-native/extend-expect'

const itemStub = { artwork: 'https//:vk.com', data: {} }
const sliderStub = { items: [itemStub], title: 'title' }
const mockData: { text: null | string } = { text: null }
const sliderRowId = 'slider-row'

describe('<Slider/>', () => {
  beforeEach(() => {
    mockData.text = null
  })

  test('return null if items prop is undefined', async () => {
    //@ts-expect-error - undefined is a not a valid items
    await renderWithProviders(<Slider items={undefined} />)
    expect(screen.toJSON()).toBeNull()
  })

  test('return null, if items length === 0', async () => {
    await renderWithProviders(<Slider items={[]} />)
    expect(screen.toJSON()).toBeNull()
  })

  test('return View, if items length > 0', async () => {
    await renderWithProviders(<Slider items={sliderStub.items} />)
    const tree = screen.toJSON()
    expect(tree).toBeDefined()
    expect(Array.isArray(tree)).toEqual(false)
    if (!tree || Array.isArray(tree)) return
    expect(tree.type).toEqual('View')
  })

  test('return 2 slider items, if items length === 2', async () => {
    await renderWithProviders(<Slider items={[itemStub, itemStub]} />)
    const tree = screen.toJSON()
    if (!tree || Array.isArray(tree)) return
    expect(screen.getAllByTestId('slider-item').length).toEqual(2)
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
    const tree = screen.toJSON()
    if (!tree || Array.isArray(tree)) return
    fireEvent.press(screen.getAllByTestId('slider-item')[0])
    expect(mockData.text).not.toBeNull()
  })

  test('has Text element, if title is defined', async () => {
    await renderWithProviders(<Slider items={sliderStub.items} title={sliderStub.title} />)
    expect(screen.queryByTestId('title')).not.toBeNull()
  })

  test('content in the Text element equals to title prop', async () => {
    await renderWithProviders(<Slider items={sliderStub.items} title={sliderStub.title} />)
    expect(screen.queryByTestId('title')).toHaveTextContent(sliderStub.title)
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

  test('length of rows elements is equal to itemsRows props', async () => {
    const { rerender } = await renderWithProviders(
      <Slider items={[itemStub, itemStub, itemStub, itemStub]} />,
    )
    expect(screen.getAllByTestId(sliderRowId).length).toEqual(1)
    let itemsRows = 2
    await rerender(
      <Slider itemsRows={itemsRows} items={[itemStub, itemStub, itemStub, itemStub]} />,
    )
    expect(screen.getAllByTestId(sliderRowId).length).toEqual(itemsRows)
    itemsRows++
    await rerender(
      <Slider itemsRows={itemsRows} items={[itemStub, itemStub, itemStub, itemStub]} />,
    )
    expect(screen.getAllByTestId(sliderRowId).length).toEqual(itemsRows)
  })
})

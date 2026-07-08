import { screen } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks'
import { IMAGE_PLACEHOLDER } from 'shared/ui/images'
import { SliderItem } from './slider-item'
import { WhereIsSlideTitleLocated } from './slider-item.types'
import '@testing-library/jest-native/extend-expect'

const propsStub = {
  artwork: 'https://traveltimes.ru/wp-content/uploads/2021/07/image-4-2048x1366.jpg',
  descriptionTitle: 'Hello',
}

const sliderItemDescriptionUnderSlideId = 'slider-item-description-under-slide'
const sliderItemTestId = 'slider-item'

const findImageSource = (node: Record<string, unknown>): string | undefined => {
  if (!node || typeof node !== 'object') return undefined
  const nodeProps = node.props as Record<string, unknown> | undefined
  if (node.type === 'Image' && nodeProps && 'source' in nodeProps)
    return (nodeProps.source as { uri?: string }).uri

  const children = node.children
  if (Array.isArray(children))
    for (const child of children) {
      const result = findImageSource(child as Record<string, unknown>)
      if (result) return result
    }
  return undefined
}

const getSourceUri = () => {
  const tree = screen.toJSON()
  if (!tree || Array.isArray(tree)) return undefined
  return findImageSource(tree as unknown as Record<string, unknown>)
}

describe('<SliderItem/>', () => {
  test('not return null or array, if artwork is valid', async () => {
    await renderWithProviders(<SliderItem testID={sliderItemTestId} artwork={propsStub.artwork} />)

    const tree = screen.toJSON()
    expect(tree).not.toBeNull()
    expect(Array.isArray(tree)).toEqual(false)
  })

  test('render with testID when artwork is valid', async () => {
    await renderWithProviders(<SliderItem testID={sliderItemTestId} artwork={propsStub.artwork} />)

    const sliderItem = screen.getByTestId(sliderItemTestId)
    expect(sliderItem).not.toBeFalsy()
    expect(sliderItem.props.testID).toEqual(sliderItemTestId)
  })

  test('use IMAGE_PLACEHOLDER, if artwork is undefined', async () => {
    await renderWithProviders(<SliderItem artwork={undefined} testID={sliderItemTestId} />)
    expect(screen.getByTestId(sliderItemTestId)).not.toBeFalsy()
    expect(getSourceUri()).toEqual(IMAGE_PLACEHOLDER)
  })

  test('use IMAGE_PLACEHOLDER, if artwork is empty string', async () => {
    await renderWithProviders(<SliderItem artwork='' testID={sliderItemTestId} />)
    expect(screen.getByTestId(sliderItemTestId)).not.toBeFalsy()
    expect(getSourceUri()).toEqual(IMAGE_PLACEHOLDER)
  })

  test('description visible, if descriptionTitle prop defined', async () => {
    await renderWithProviders(
      <SliderItem artwork={propsStub.artwork} descriptionTitle={propsStub.descriptionTitle} />,
    )
    const tree = screen.toJSON()
    if (!tree || Array.isArray(tree)) return

    const sliderItemDescriptionUnderSlide = screen.getByTestId(sliderItemDescriptionUnderSlideId)
    expect(sliderItemDescriptionUnderSlide).not.toBeFalsy()
  })

  test('description component type is View', async () => {
    await renderWithProviders(
      <SliderItem artwork={propsStub.artwork} descriptionTitle={propsStub.descriptionTitle} />,
    )
    const tree = screen.toJSON()
    if (!tree || Array.isArray(tree)) return

    const sliderItemDescriptionUnderSlide = screen.getByTestId(sliderItemDescriptionUnderSlideId)
    expect(sliderItemDescriptionUnderSlide?.type).toEqual('View')
  })

  test('description visible on slider when whereIsSlideTitleLocated is On', async () => {
    await renderWithProviders(
      <SliderItem
        artwork={propsStub.artwork}
        descriptionTitle={propsStub.descriptionTitle}
        whereIsSlideTitleLocated={WhereIsSlideTitleLocated.On}
      />,
    )

    const tree = screen.toJSON()
    if (!tree || Array.isArray(tree)) return

    const onSlide = screen.queryByTestId('slider-item-description-on-slide')
    const underSlide = screen.queryByTestId(sliderItemDescriptionUnderSlideId)

    expect(onSlide).not.toBeFalsy()
    expect(underSlide).toBeFalsy()
  })

  test('descriptions visible on and under slider when whereIsSlideTitleLocated is BothOnAndUnder', async () => {
    await renderWithProviders(
      <SliderItem
        artwork={propsStub.artwork}
        descriptionTitle={propsStub.descriptionTitle}
        whereIsSlideTitleLocated={WhereIsSlideTitleLocated.BothOnAndUnder}
      />,
    )

    const tree = screen.toJSON()
    if (!tree || Array.isArray(tree)) return

    const onSlide = screen.queryByTestId('slider-item-description-on-slide')
    const underSlide = screen.queryByTestId(sliderItemDescriptionUnderSlideId)

    expect(onSlide).not.toBeFalsy()
    expect(underSlide).not.toBeFalsy()
  })
})

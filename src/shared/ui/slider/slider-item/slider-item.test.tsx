import { screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { APP_ICON_URI as IMAGE_PLACEHOLDER } from '../../../lib/app-icon'
import { renderWithProviders } from '../../../mocks/renderWithProviders'
import { TITLE_ON_CARD_TEST_ID } from './card-overlay'
import { SliderItem } from './slider-item'
import { WhereIsSlideTitleLocated } from './slider-item.types'

const propsStub = {
  artwork: 'https://traveltimes.ru/wp-content/uploads/2021/07/image-4-2048x1366.jpg',
  description: 'Описание плейлиста',
  title: 'Hello',
}

const sliderItemTestId = 'slider-item'

const findImageSource = (node: Record<string, unknown>): string | undefined => {
  if (!node || typeof node !== 'object') return undefined
  const nodeProps = node.props as Record<string, unknown> | undefined
  if (nodeProps && 'source' in nodeProps) {
    const uri = (nodeProps.source as { uri?: string })?.uri
    if (uri) return uri
  }

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

const iconStub = <Text>icon</Text>

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

  test('title visible under the card by default', async () => {
    await renderWithProviders(<SliderItem title={propsStub.title} artwork={propsStub.artwork} />)

    expect(screen.getAllByText(propsStub.title).length).toBeGreaterThan(0)
    expect(screen.queryByTestId(TITLE_ON_CARD_TEST_ID)).toBeNull()
  })

  test('title visible on card when whereIsSlideTitleLocated is On', async () => {
    await renderWithProviders(
      <SliderItem
        title={propsStub.title}
        artwork={propsStub.artwork}
        whereIsSlideTitleLocated={WhereIsSlideTitleLocated.On}
      />,
    )

    expect(screen.getByTestId(TITLE_ON_CARD_TEST_ID)).toBeTruthy()
  })

  test('title overlays the icon card when whereIsSlideTitleLocated is On', async () => {
    await renderWithProviders(
      <SliderItem
        artwork={null}
        artworkIcon={iconStub}
        title={propsStub.title}
        whereIsSlideTitleLocated={WhereIsSlideTitleLocated.On}
      />,
    )

    expect(screen.getByTestId(TITLE_ON_CARD_TEST_ID)).toBeTruthy()
  })

  test('renders the description text on the card when enabled', async () => {
    await renderWithProviders(
      <SliderItem
        title={propsStub.title}
        artwork={propsStub.artwork}
        isDescriptionTitleOnSlideLarge
        description={propsStub.description}
        whereIsSlideTitleLocated={WhereIsSlideTitleLocated.On}
      />,
    )

    expect(screen.getByText(propsStub.description)).toHaveTextContent(propsStub.description, {
      exact: false,
    })
  })

  test('hides the description text when isDescriptionTitleOnSlideLarge is false', async () => {
    await renderWithProviders(
      <SliderItem
        artwork={propsStub.artwork}
        description={propsStub.description}
        isDescriptionTitleOnSlideLarge={false}
      />,
    )

    expect(screen.queryByText(propsStub.description)).toBeNull()
  })

  test('does not render the description text on icon cards', async () => {
    await renderWithProviders(
      <SliderItem
        artwork={null}
        artworkIcon={iconStub}
        isDescriptionTitleOnSlideLarge
        description={propsStub.description}
      />,
    )

    expect(screen.queryByText(propsStub.description)).toBeNull()
  })
})

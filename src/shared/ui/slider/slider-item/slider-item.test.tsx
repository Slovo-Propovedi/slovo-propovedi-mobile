import { screen, within } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { APP_ICON_URI as IMAGE_PLACEHOLDER } from '../../../lib/app-icon'
import { renderWithProviders } from '../../../mocks/renderWithProviders'
import { FONT_SIZES } from '../../../ui/theme/themed'
import { TITLE_ON_CARD_TEST_ID } from './card-overlay'
import { SliderItem } from './slider-item'
import { SliderItemSize, SliderItemTransform, WhereIsSlideTitleLocated } from './slider-item.types'

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

// `On` and `Both` render the same overlay DOM; only the title area style tells
// them apart, so layout assertions resolve the rendered style instead of props.
const readTitleAreaStyle = () =>
  StyleSheet.flatten(screen.getByTestId(TITLE_ON_CARD_TEST_ID).props.style)

const BOTTOM_TITLE_PLATE_BACKGROUND = 'rgba(0, 0, 0, 0.55)'

// The text's own view inside SliderItemText is transparent; its parent is the
// shared scrim stack that carries the plate for title and description alike.
const readBottomStackStyle = (title: string) =>
  StyleSheet.flatten(screen.getByText(title).parent?.parent?.props.style)

// The title's Text style lives inside the on-card overlay; flatten it there so
// the assertion targets the exact node whose boldness depends on placement.
const readCardTitleTextStyle = (title: string) =>
  StyleSheet.flatten(within(screen.getByTestId(TITLE_ON_CARD_TEST_ID)).getByText(title).props.style)

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

  test('renders the blurred letter tile over the default cover when artwork is missing', async () => {
    await renderWithProviders(<SliderItem title='Hello' artwork={null} />)

    expect(screen.getByText('H')).toBeTruthy()
    expect(getSourceUri()).toEqual(IMAGE_PLACEHOLDER)
  })

  test('hides the letter tile when the title is located on the card', async () => {
    await renderWithProviders(
      <SliderItem
        title='Hello'
        artwork={null}
        whereIsSlideTitleLocated={WhereIsSlideTitleLocated.On}
      />,
    )

    expect(screen.queryByText('H')).toBeNull()
    expect(screen.getByTestId(TITLE_ON_CARD_TEST_ID)).toBeTruthy()
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
    expect(StyleSheet.flatten(screen.getByText(propsStub.title).props.style)).toEqual(
      expect.objectContaining({ fontWeight: 'bold' }),
    )
  })

  test('renders the under-card title on two lines with a constant caption font', async () => {
    await renderWithProviders(<SliderItem title={propsStub.title} artwork={propsStub.artwork} />)

    const title = screen.getByText(propsStub.title)

    expect(title.props.numberOfLines).toEqual(2)
    expect(StyleSheet.flatten(title.props.style)).toEqual(
      expect.objectContaining({ fontSize: FONT_SIZES.md }),
    )
  })

  test('scales the centered on-card title with the card size', async () => {
    await renderWithProviders(
      <SliderItem
        title={propsStub.title}
        artwork={propsStub.artwork}
        size={SliderItemSize.Large}
        whereIsSlideTitleLocated={WhereIsSlideTitleLocated.On}
      />,
    )

    expect(StyleSheet.flatten(screen.getByText(propsStub.title).props.style)).toEqual(
      expect.objectContaining({ fontSize: FONT_SIZES.h3 }),
    )
  })

  test('keeps the bothOnAndUnder title compact on a middle card', async () => {
    await renderWithProviders(
      <SliderItem
        title={propsStub.title}
        artwork={propsStub.artwork}
        size={SliderItemSize.Middle}
        whereIsSlideTitleLocated={WhereIsSlideTitleLocated.Both}
      />,
    )

    const title = screen.getByText(propsStub.title)

    expect(title.props.numberOfLines).toEqual(1)
    expect(StyleSheet.flatten(title.props.style)).toEqual(
      expect.objectContaining({ fontSize: FONT_SIZES.md }),
    )
    expect(StyleSheet.flatten(title.props.style)).toEqual(
      expect.objectContaining({ fontWeight: 'bold' }),
    )
  })

  test('caps the description lines by card size and transform', async () => {
    await renderWithProviders(
      <SliderItem
        title={propsStub.title}
        artwork={propsStub.artwork}
        size={SliderItemSize.XLarge}
        isDescriptionTitleOnSlideLarge
        description={propsStub.description}
        transform={SliderItemTransform.Short}
        whereIsSlideTitleLocated={WhereIsSlideTitleLocated.On}
      />,
    )

    expect(screen.getByText(propsStub.description).props.numberOfLines).toEqual(2)
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
    expect(readCardTitleTextStyle(propsStub.title)).toEqual(
      expect.objectContaining({ fontWeight: 'bold' }),
    )
  })

  test('renders the bottom-stacked title without the letter when whereIsSlideTitleLocated is Both', async () => {
    const { rerender } = await renderWithProviders(
      <SliderItem
        title='Hello'
        artwork={null}
        whereIsSlideTitleLocated={WhereIsSlideTitleLocated.Both}
      />,
    )

    expect(screen.getByTestId(TITLE_ON_CARD_TEST_ID)).toBeTruthy()
    expect(screen.queryByText('H')).toBeNull()
    expect(screen.getAllByText('Hello')).toHaveLength(1)

    const bottomStyle = readTitleAreaStyle()

    await rerender(
      <SliderItem
        title='Hello'
        artwork={null}
        whereIsSlideTitleLocated={WhereIsSlideTitleLocated.On}
      />,
    )

    expect(bottomStyle).not.toEqual(readTitleAreaStyle())
  })

  test('stacks the title above the description at the card bottom for Both', async () => {
    await renderWithProviders(
      <SliderItem
        title={propsStub.title}
        artwork={propsStub.artwork}
        isDescriptionTitleOnSlideLarge
        description={propsStub.description}
        whereIsSlideTitleLocated={WhereIsSlideTitleLocated.Both}
      />,
    )

    const titleArea = screen.getByTestId(TITLE_ON_CARD_TEST_ID)

    expect(screen.getByText(propsStub.description)).toBeTruthy()
    expect(titleArea.parent?.children[0]).toBe(titleArea)
    expect(readBottomStackStyle(propsStub.title)).toEqual(
      expect.objectContaining({ backgroundColor: BOTTOM_TITLE_PLATE_BACKGROUND }),
    )
  })

  test('title overlays the icon card when whereIsSlideTitleLocated is Both', async () => {
    await renderWithProviders(
      <SliderItem
        artwork={null}
        artworkIcon={iconStub}
        title={propsStub.title}
        whereIsSlideTitleLocated={WhereIsSlideTitleLocated.Both}
      />,
    )

    expect(screen.getByTestId(TITLE_ON_CARD_TEST_ID)).toBeTruthy()
    expect(readBottomStackStyle(propsStub.title)).toEqual(
      expect.objectContaining({ backgroundColor: BOTTOM_TITLE_PLATE_BACKGROUND }),
    )
    expect(readCardTitleTextStyle(propsStub.title)).toEqual(
      expect.objectContaining({ fontWeight: 'bold' }),
    )
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

import { screen } from '@testing-library/react-native'
import { Appearance, StyleSheet } from 'react-native'
import { renderWithProviders } from '../../../mocks/renderWithProviders'
import { SliderItemText } from './slider-item-text'
import { SliderItemTextBackgroundStyle } from './slider-item-text.types'

const propsStub = {
  subTitle: 'Sub',
  title: 'Hello',
}

describe('<SliderItemText/>', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('return null if title prop is undefined', async () => {
    await renderWithProviders(
      <SliderItemText
        // @ts-expect-error - undefined is not a valid title
        title={undefined}
      />,
    )

    expect(screen.queryByText(propsStub.title)).toBeNull()
  })

  test('return null, if title === ""', async () => {
    await renderWithProviders(<SliderItemText title='' />)

    expect(screen.queryByText(propsStub.title)).toBeNull()
  })

  test('renders the title text when title is valid', async () => {
    await renderWithProviders(<SliderItemText title={propsStub.title} />)

    const title = screen.getAllByText(propsStub.title)[0]

    expect(title).toBeTruthy()
    expect(title.type).toEqual('Text')
    expect(title).toHaveTextContent(propsStub.title, { exact: false })
  })

  test('keeps the title on one line by default', async () => {
    await renderWithProviders(<SliderItemText title={propsStub.title} />)

    expect(screen.getByText(propsStub.title).props.numberOfLines).toEqual(1)
  })

  test('honours the maxLines and titleFontSize overrides', async () => {
    await renderWithProviders(
      <SliderItemText maxLines={2} titleFontSize={20} title={propsStub.title} />,
    )

    const title = screen.getByText(propsStub.title)

    expect(title.props.numberOfLines).toEqual(2)
    expect(title).toHaveStyle({ fontSize: 20 })
  })

  test('renders the sub title when subTitle prop is defined', async () => {
    await renderWithProviders(
      <SliderItemText title={propsStub.title} subTitle={propsStub.subTitle} />,
    )

    const subTitle = screen.getByText(propsStub.subTitle)

    expect(subTitle.type).toEqual('Text')
    expect(subTitle).toHaveTextContent(propsStub.subTitle, { exact: false })
  })

  test('makes the card title bold', async () => {
    await renderWithProviders(<SliderItemText title={propsStub.title} />)

    expect(screen.getByText(propsStub.title)).toHaveStyle({ fontWeight: 'bold' })
  })

  test('adds a white halo to the title drawn on artwork with dark text', async () => {
    jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('light')

    await renderWithProviders(<SliderItemText isOnArtwork title={propsStub.title} />)

    expect(screen.getByText(propsStub.title)).toHaveStyle({
      textShadowColor: 'rgba(255, 255, 255, 0.7)',
      textShadowOffset: { height: 0, width: 0 },
      textShadowRadius: 10,
    })
  })

  test('adds a black halo to the title drawn on artwork with light text', async () => {
    jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('dark')

    await renderWithProviders(<SliderItemText isOnArtwork title={propsStub.title} />)

    expect(screen.getByText(propsStub.title)).toHaveStyle({
      textShadowColor: 'rgba(0, 0, 0, 0.7)',
      textShadowOffset: { height: 0, width: 0 },
      textShadowRadius: 10,
    })
  })

  test('does not add a halo when the title sits on a plate', async () => {
    await renderWithProviders(
      <SliderItemText
        isOnArtwork
        title={propsStub.title}
        backgroundStyle={SliderItemTextBackgroundStyle.Dark}
      />,
    )

    const titleStyle = StyleSheet.flatten(screen.getByText(propsStub.title).props.style)

    expect(titleStyle).not.toHaveProperty('textShadowColor')
    expect(titleStyle).not.toHaveProperty('textShadowRadius')
  })

  test('does not add a halo when the title is not drawn on artwork', async () => {
    await renderWithProviders(<SliderItemText title={propsStub.title} />)

    const titleStyle = StyleSheet.flatten(screen.getByText(propsStub.title).props.style)

    expect(titleStyle).not.toHaveProperty('textShadowColor')
    expect(titleStyle).not.toHaveProperty('textShadowRadius')
  })
})

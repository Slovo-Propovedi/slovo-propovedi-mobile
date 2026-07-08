import { screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { SliderItemDescription } from './slider-item-description'

const propsStub = {
  subTitle: 'Sub',
  title: 'Hello',
}

const sliderItemDescriptionTitleId = 'slider-item-description-title'

describe('<SliderItemDescription/>', () => {
  test('return null if title prop is undefined', async () => {
    await renderWithProviders(
      <SliderItemDescription
        // @ts-expect-error - undefined is a not a valid title
        title={undefined}
      />,
    )

    const tree = screen.toJSON()
    expect(tree).toBeNull()
  })

  test('return null, if title === ""', async () => {
    await renderWithProviders(<SliderItemDescription title='' />)

    const tree = screen.toJSON()
    expect(tree).toBeNull()
  })

  test('not return null or array, if title is valid', async () => {
    await renderWithProviders(<SliderItemDescription title={propsStub.title} />)

    const tree = screen.toJSON()
    expect(tree).not.toBeNull()
    expect(Array.isArray(tree)).toEqual(false)
  })

  test('return View, if title is valid', async () => {
    await renderWithProviders(<SliderItemDescription title={propsStub.title} />)

    const tree = screen.toJSON()

    if (!tree || Array.isArray(tree)) return

    expect(tree.type).toEqual('View')

    expect(tree.children).not.toBeNull()

    if (!Array.isArray(tree.children)) return

    expect(tree.children.length).toEqual(1)
  })

  test('text is visible, if title prop valid', async () => {
    await renderWithProviders(<SliderItemDescription title={propsStub.title} />)

    const tree = screen.toJSON()

    if (!tree || Array.isArray(tree)) return

    const sliderItemDescription = screen.getByTestId(sliderItemDescriptionTitleId)

    expect(sliderItemDescription).not.toBeFalsy()
  })
  test('title is Text in View', async () => {
    const { root } = await renderWithProviders(<SliderItemDescription title={propsStub.title} />)

    const sliderItemDescriptionTitle = screen.getByTestId(sliderItemDescriptionTitleId)

    expect(root?.children.length).toEqual(1)

    expect(sliderItemDescriptionTitle?.type).toEqual('Text')
    expect(typeof sliderItemDescriptionTitle?.children[0]).toEqual('string')
  })

  test('text in title field equals to title prop', async () => {
    await renderWithProviders(<SliderItemDescription title={propsStub.title} />)

    const sliderItemDescriptionTitle = screen.getByTestId(sliderItemDescriptionTitleId)

    expect(sliderItemDescriptionTitle).toHaveTextContent(propsStub.title)
  })

  test('subTitle visible, if subTitle prop defined', async () => {
    await renderWithProviders(
      <SliderItemDescription title={propsStub.title} subTitle={propsStub.subTitle} />,
    )

    const sliderItemDescriptionSubTitle = screen.getByTestId('slider-item-description-sub-title')

    expect(sliderItemDescriptionSubTitle?.type).toEqual('Text')
    expect(typeof sliderItemDescriptionSubTitle?.children[0]).toEqual('string')
  })
  test('text in title field equals to title prop', async () => {
    await renderWithProviders(
      <SliderItemDescription title={propsStub.title} subTitle={propsStub.subTitle} />,
    )

    const sliderItemDescriptionSubTitle = screen.getByTestId('slider-item-description-sub-title')

    expect(sliderItemDescriptionSubTitle).toHaveTextContent(propsStub.subTitle)
  })
})

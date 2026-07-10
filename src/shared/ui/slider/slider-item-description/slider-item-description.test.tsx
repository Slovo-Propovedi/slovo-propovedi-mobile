import { screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { renderWithProviders } from '../../../mocks/renderWithProviders'
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

    expect(screen.queryByTestId(sliderItemDescriptionTitleId)).toBeNull()
  })

  test('return null, if title === ""', async () => {
    await renderWithProviders(<SliderItemDescription title='' />)

    expect(screen.queryByTestId(sliderItemDescriptionTitleId)).toBeNull()
  })

  test('not return null or array, if title is valid', async () => {
    await renderWithProviders(<SliderItemDescription title={propsStub.title} />)

    expect(screen.getByTestId(sliderItemDescriptionTitleId)).not.toBeNull()
  })

  test('return View, if title is valid', async () => {
    await renderWithProviders(<SliderItemDescription title={propsStub.title} />)

    const title = screen.getByTestId(sliderItemDescriptionTitleId)

    expect(title).toBeTruthy()
    expect(title.type).toEqual('View')
    expect(title.children).not.toBeNull()
  })

  test('text is visible, if title prop valid', async () => {
    await renderWithProviders(<SliderItemDescription title={propsStub.title} />)

    const sliderItemDescription = screen.getByTestId(sliderItemDescriptionTitleId)

    expect(sliderItemDescription).not.toBeFalsy()
  })
  test('title is View with text content', async () => {
    const { root } = await renderWithProviders(<SliderItemDescription title={propsStub.title} />)

    const sliderItemDescriptionTitle = screen.getByTestId(sliderItemDescriptionTitleId)

    expect(root?.children.length).toEqual(1)

    expect(sliderItemDescriptionTitle?.type).toEqual('View')
    expect(sliderItemDescriptionTitle).toHaveTextContent(propsStub.title)
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

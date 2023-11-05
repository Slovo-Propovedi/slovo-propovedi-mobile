import { render, screen } from '@testing-library/react-native';
import { SliderItemDescription } from './slider-item-description';
import '@testing-library/jest-native/extend-expect';

const propsStub = {
  subTitle: 'Sub',
  title: 'Hello',
};

describe('<SliderItemDescription/>', () => {
  test('return null if title prop is undefined', () => {
    render(
      <SliderItemDescription
        // @ts-expect-error - undefined is a not a valid title
        title={undefined}
      />,
    );

    const tree = screen.toJSON();
    expect(tree).toBeNull();
  });

  test('return null, if title === ""', () => {
    render(<SliderItemDescription title='' />);

    const tree = screen.toJSON();
    expect(tree).toBeNull();
  });

  test('not return null or array, if title is valid', () => {
    render(<SliderItemDescription title={propsStub.title} />);

    const tree = screen.toJSON();
    expect(tree).not.toBeNull();
    expect(Array.isArray(tree)).toEqual(false);
  });

  test('return View, if title is valid', () => {
    render(<SliderItemDescription title={propsStub.title} />);

    const tree = screen.toJSON();

    if (!tree || Array.isArray(tree)) {
      return;
    }

    expect(tree.type).toEqual('View');

    expect(tree.children).not.toBeNull();

    if (!Array.isArray(tree.children)) {
      return;
    }

    expect(tree.children.length).toEqual(1);
  });

  test('text is visible, if title prop valid', () => {
    render(<SliderItemDescription title={propsStub.title} />);

    const tree = screen.toJSON();

    if (!tree || Array.isArray(tree)) {
      return;
    }

    const sliderItemDescription = screen.getByTestId('slider-item-description-title');

    expect(sliderItemDescription).not.toBeFalsy();
  });
  test('title is Text in View', () => {
    const { root } = render(<SliderItemDescription title={propsStub.title} />);

    const sliderItemDescriptionTitle = screen.getByTestId('slider-item-description-title');

    expect(root.children.length).toEqual(1);

    expect(sliderItemDescriptionTitle?.type).toEqual('Text');
    expect(typeof sliderItemDescriptionTitle?.children[0]).toEqual('string');
  });

  test('text in title field equals to title prop', () => {
    render(<SliderItemDescription title={propsStub.title} />);

    const sliderItemDescriptionTitle = screen.getByTestId('slider-item-description-title');

    expect(sliderItemDescriptionTitle).toHaveTextContent(propsStub.title);
  });

  test('subTitle visible, if subTitle prop defined', () => {
    render(<SliderItemDescription subTitle={propsStub.subTitle} title={propsStub.title} />);

    const sliderItemDescriptionSubTitle = screen.getByTestId('slider-item-description-sub-title');

    expect(sliderItemDescriptionSubTitle?.type).toEqual('Text');
    expect(typeof sliderItemDescriptionSubTitle?.children[0]).toEqual('string');
  });
  test('text in title field equals to title prop', () => {
    render(<SliderItemDescription subTitle={propsStub.subTitle} title={propsStub.title} />);

    const sliderItemDescriptionSubTitle = screen.getByTestId('slider-item-description-sub-title');

    expect(sliderItemDescriptionSubTitle).toHaveTextContent(propsStub.subTitle);
  });
});

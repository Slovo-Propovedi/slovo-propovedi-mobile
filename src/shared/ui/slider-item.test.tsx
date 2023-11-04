import { render, screen } from '@testing-library/react-native';
import { SliderItem } from './slider-item';
import '@testing-library/jest-native/extend-expect';

const propsStub = {
  description: 'Hello',
  previewURL: 'https://traveltimes.ru/wp-content/uploads/2021/07/image-4-2048x1366.jpg',
};

describe('<SliderItem/>', () => {
  test('return null if previewURL prop is undefined', () => {
    render(
      <SliderItem
        displayingTitleInSlide={{ isSlideTitleUnderSlide: true }}
        // @ts-expect-error - undefined is a not a valid previewURL
        previewURL={undefined}
      />,
    );

    const tree = screen.toJSON();
    expect(tree).toBeNull();
  });

  test('return null, if previewURL === ""', () => {
    render(<SliderItem displayingTitleInSlide={{ isSlideTitleUnderSlide: true }} previewURL='' />);

    const tree = screen.toJSON();
    expect(tree).toBeNull();
  });

  test('not return null or array, if previewURL is valid', () => {
    render(
      <SliderItem
        displayingTitleInSlide={{ isSlideTitleUnderSlide: true }}
        previewURL={propsStub.previewURL}
      />,
    );

    const tree = screen.toJSON();
    expect(tree).not.toBeNull();
    expect(Array.isArray(tree)).toEqual(false);
  });

  test('return TouchableImageBackground, if previewURL is valid', () => {
    render(
      <SliderItem
        displayingTitleInSlide={{ isSlideTitleUnderSlide: true }}
        previewURL={propsStub.previewURL}
      />,
    );

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

  test('description visible, if description prop defined', () => {
    render(
      <SliderItem
        description={propsStub.description}
        displayingTitleInSlide={{ isSlideTitleUnderSlide: true }}
        previewURL={propsStub.previewURL}
      />,
    );

    const tree = screen.toJSON();

    if (!tree || Array.isArray(tree)) {
      return;
    }

    const sliderItemDescription = screen.getByTestId('slider-item-description');

    expect(sliderItemDescription).not.toBeFalsy();
  });
  test('description component type is View', () => {
    render(
      <SliderItem
        description={propsStub.description}
        displayingTitleInSlide={{ isSlideTitleUnderSlide: true }}
        previewURL={propsStub.previewURL}
      />,
    );

    const tree = screen.toJSON();

    if (!tree || Array.isArray(tree)) {
      return;
    }

    const sliderItemDescription = screen.getByTestId('slider-item-description');

    expect(sliderItemDescription?.type).toEqual('View');
  });
  test('description child component type is Text in View', () => {
    render(
      <SliderItem
        description={propsStub.description}
        displayingTitleInSlide={{ isSlideTitleUnderSlide: true }}
        previewURL={propsStub.previewURL}
      />,
    );

    const sliderItemDescription = screen.getByTestId('slider-item-description');
    const sliderItemDescriptionText = screen.getByTestId('slider-item-description-text');

    expect(sliderItemDescription?.children.length).toEqual(1);

    expect(sliderItemDescriptionText?.type).toEqual('Text');
    expect(typeof sliderItemDescriptionText?.children[0]).toEqual('string');
  });

  test('text in description field equals to description prop', () => {
    render(
      <SliderItem
        description={propsStub.description}
        displayingTitleInSlide={{ isSlideTitleUnderSlide: true }}
        previewURL={propsStub.previewURL}
      />,
    );

    const sliderItemDescriptionText = screen.getByTestId('slider-item-description-text');

    expect(sliderItemDescriptionText).toHaveTextContent(propsStub.description);
  });
});

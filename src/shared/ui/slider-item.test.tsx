import { render, screen } from '@testing-library/react-native';
import { SliderItem, WhereIsSlideTitleLocated } from './slider-item';
import '@testing-library/jest-native/extend-expect';

const propsStub = {
  descriptionTitle: 'Hello',
  previewURL: 'https://traveltimes.ru/wp-content/uploads/2021/07/image-4-2048x1366.jpg',
};

describe('<SliderItem/>', () => {
  test('return null if previewURL prop is undefined', () => {
    render(
      <SliderItem
        // @ts-expect-error - undefined is a not a valid previewURL
        previewURL={undefined}
      />,
    );

    const tree = screen.toJSON();
    expect(tree).toBeNull();
  });

  test('return null, if previewURL === ""', () => {
    render(<SliderItem previewURL='' />);

    const tree = screen.toJSON();
    expect(tree).toBeNull();
  });

  test('not return null or array, if previewURL is valid', () => {
    render(<SliderItem previewURL={propsStub.previewURL} />);

    const tree = screen.toJSON();
    expect(tree).not.toBeNull();
    expect(Array.isArray(tree)).toEqual(false);
  });

  test('return TouchableImageBackground, if previewURL is valid', () => {
    render(<SliderItem previewURL={propsStub.previewURL} />);

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

  test('description visible, if descriptionTitle prop defined', () => {
    render(
      <SliderItem
        descriptionTitle={propsStub.descriptionTitle}
        previewURL={propsStub.previewURL}
      />,
    );

    const tree = screen.toJSON();

    if (!tree || Array.isArray(tree)) {
      return;
    }

    const sliderItemDescriptionUnderSlide = screen.getByTestId(
      'slider-item-description-under-slide',
    );

    expect(sliderItemDescriptionUnderSlide).not.toBeFalsy();
  });
  test('description component type is View', () => {
    render(
      <SliderItem
        descriptionTitle={propsStub.descriptionTitle}
        previewURL={propsStub.previewURL}
      />,
    );

    const tree = screen.toJSON();

    if (!tree || Array.isArray(tree)) {
      return;
    }

    const sliderItemDescriptionUnderSlide = screen.getByTestId(
      'slider-item-description-under-slide',
    );

    expect(sliderItemDescriptionUnderSlide?.type).toEqual('View');
  });
  test('description visible on slider, if descriptionTitle prop defined and whereIsSlideTitleLocated defined as On', () => {
    render(
      <SliderItem
        descriptionTitle={propsStub.descriptionTitle}
        previewURL={propsStub.previewURL}
        whereIsSlideTitleLocated={WhereIsSlideTitleLocated.On}
      />,
    );

    const tree = screen.toJSON();

    if (!tree || Array.isArray(tree)) {
      return;
    }

    const sliderItemDescriptionOnSlide = screen.queryByTestId('slider-item-description-on-slide');
    const sliderItemDescriptionUnderSlide = screen.queryByTestId(
      'slider-item-description-under-slide',
    );

    expect(sliderItemDescriptionOnSlide).not.toBeFalsy();
    expect(sliderItemDescriptionUnderSlide).toBeFalsy();
  });
  test('descriptions visible on and under slider, if descriptionTitle prop defined and whereIsSlideTitleLocated defined as BothOnAndUnder', () => {
    render(
      <SliderItem
        descriptionTitle={propsStub.descriptionTitle}
        previewURL={propsStub.previewURL}
        whereIsSlideTitleLocated={WhereIsSlideTitleLocated.BothOnAndUnder}
      />,
    );

    const tree = screen.toJSON();

    if (!tree || Array.isArray(tree)) {
      return;
    }

    const sliderItemDescriptionOnSlide = screen.queryByTestId('slider-item-description-on-slide');
    const sliderItemDescriptionUnderSlide = screen.queryByTestId(
      'slider-item-description-under-slide',
    );

    expect(sliderItemDescriptionOnSlide).not.toBeFalsy();
    expect(sliderItemDescriptionUnderSlide).not.toBeFalsy();
  });
});

import type { Meta, StoryObj } from '@storybook/react';

import { SliderItem, SliderItemSize, WhereIsSlideTitleLocated } from './slider-item';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
  args: {
    previewURL: 'https://slovo-istini.com/images/logo.jpg',
  },
  component: SliderItem,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  title: 'SHARED/SliderItem',
} satisfies Meta<typeof SliderItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithDescription: Story = {
  args: {
    descriptionTitle: 'Desc',
  },
};

export const Small: Story = {};

export const Middle: Story = {
  args: {
    size: SliderItemSize.Middle,
  },
};
export const Large: Story = {
  args: {
    size: SliderItemSize.Large,
  },
};

export const Short: Story = {
  args: {
    isShort: true,
  },
};
export const ShortWithDescriptionUnderSlide: Story = {
  args: {
    descriptionTitle: 'Title',
    isShort: true,
  },
};
export const ShortWithDescriptionOnSlide: Story = {
  args: {
    descriptionTitle: 'Title',
    isShort: true,
    whereIsSlideTitleLocated: WhereIsSlideTitleLocated.On,
  },
};
export const WithDescriptionOnSlide: Story = {
  args: {
    descriptionTitle: 'Title',
    whereIsSlideTitleLocated: WhereIsSlideTitleLocated.On,
  },
};
export const WithDescriptionBothOnAndUnderSlide: Story = {
  args: {
    descriptionTitle: 'Title',
    whereIsSlideTitleLocated: WhereIsSlideTitleLocated.BothOnAndUnder,
  },
};

import type { Meta, StoryObj } from '@storybook/react';

import { SliderItem, SliderItemSize } from './slider-item';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
  args: {
    previewURL: 'https://i.pinimg.com/236x/0e/bd/26/0ebd262c4b7f69f7ec915dbd8509328f.jpg',
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
    description: 'Desc',
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

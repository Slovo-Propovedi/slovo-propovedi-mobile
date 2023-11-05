import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from './slider';
import { SliderItemSize } from './slider-item';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
  args: {
    items: [
      { data: {}, previewURL: 'https://slovo-istini.com/images/logo.jpg' },
      {
        data: {},
        description: 'Description',
        previewURL: 'https://slovo-istini.com/images/logo.jpg',
      },
      {
        data: {},
        description: 'Description',
        previewURL: 'https://slovo-istini.com/images/logo.jpg',
      },
      {
        data: {},
        description: 'Description',
        previewURL: 'https://slovo-istini.com/images/logo.jpg',
      },
      {
        data: {},
        description: 'Description',
        previewURL: 'https://slovo-istini.com/images/logo.jpg',
      },
      {
        data: {},
        description: 'Description',
        previewURL: 'https://slovo-istini.com/images/logo.jpg',
      },
      {
        data: {},
        description: 'Description',
        previewURL: 'https://slovo-istini.com/images/logo.jpg',
      },
      {
        data: {},
        description: 'Description',
        previewURL: 'https://slovo-istini.com/images/logo.jpg',
      },
      {
        data: {},
        description: 'Description',
        previewURL: 'https://slovo-istini.com/images/logo.jpg',
      },
      {
        data: {},
        description: 'Description',
        previewURL: 'https://slovo-istini.com/images/logo.jpg',
      },
      {
        data: {},
        description: 'Description',
        previewURL: 'https://slovo-istini.com/images/logo.jpg',
      },
      {
        data: {},
        description: 'Description',
        previewURL: 'https://slovo-istini.com/images/logo.jpg',
      },
      {
        data: {},
        description: 'Description',
        previewURL: 'https://slovo-istini.com/images/logo.jpg',
      },
      {
        data: {},
        description: 'Description',
        previewURL: 'https://slovo-istini.com/images/logo.jpg',
      },
      {
        data: {},
        description: 'Description',
        previewURL: 'https://slovo-istini.com/images/logo.jpg',
      },
      {
        data: {},
        description: 'Description',
        previewURL: 'https://slovo-istini.com/images/logo.jpg',
      },
      {
        data: {},
        description: 'Description',
        previewURL: 'https://slovo-istini.com/images/logo.jpg',
      },
      {
        data: {},
        description: 'Description',
        previewURL: 'https://slovo-istini.com/images/logo.jpg',
      },
      {
        data: {},
        description: 'Description',
        previewURL: 'https://slovo-istini.com/images/logo.jpg',
      },
      {
        data: {},
        description: 'Description',
        previewURL: 'https://slovo-istini.com/images/logo.jpg',
      },
    ],
    title: 'Slider',
  },
  component: Slider,

  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  title: 'SHARED/Slider',
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: {},
};

export const Short: Story = {
  args: {
    isShort: true,
    itemsSize: SliderItemSize.Middle,
  },
};

export const MultiRow: Story = {
  args: {
    itemsRows: 2,
  },
};
export const ShortMultiRow: Story = {
  args: {
    isShort: true,
    itemsRows: 2,
  },
};

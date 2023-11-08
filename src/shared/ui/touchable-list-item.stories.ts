import type { Meta, StoryObj } from '@storybook/react';

import { TouchableListItem } from './touchable-list-item';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
  args: {},
  component: TouchableListItem,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  title: 'SHARED/TouchableListItem',
} satisfies Meta<typeof TouchableListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPreviewPlaceholderText: Story = {
  args: {
    data: { title: 'Title' },
    previewPlaceholderText: 'Pr',
  },
};

export const WithPreview: Story = {
  args: {
    data: { previewUrl: 'https://slovo-istini.com/images/logo.jpg', title: 'Title' },
  },
};

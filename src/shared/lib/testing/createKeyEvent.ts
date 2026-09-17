export interface FakeKeyEvent {
  altKey: boolean
  ctrlKey: boolean
  key: string
  metaKey: boolean
  preventDefault: () => void
  repeat: boolean
  shiftKey: boolean
  stopPropagation: () => void
  target: unknown
}

export const createKeyEvent = (overrides: Partial<FakeKeyEvent> = {}): FakeKeyEvent => ({
  altKey: false,
  ctrlKey: false,
  key: 'ArrowRight',
  metaKey: false,
  preventDefault: jest.fn(),
  repeat: false,
  shiftKey: false,
  stopPropagation: jest.fn(),
  target: null,
  ...overrides,
})

export const createKeyDownEvent = (
  key: string,
  modifiers: Partial<Pick<FakeKeyEvent, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'>> = {},
): FakeKeyEvent => createKeyEvent({ key, ...modifiers })

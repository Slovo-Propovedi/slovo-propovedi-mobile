import { createDropTracker } from './dropTracker'

const file = (name: string) => ({ name }) as unknown as File

const item = (kind: string, type: string, name?: string) => ({ kind, name, type })

interface DragEventInit {
  items?: ReturnType<typeof item>[]
  types?: string[]
}

const dragEvent = (files: File[] = [], { items, types = ['Files'] }: DragEventInit = {}) => ({
  dataTransfer: { files, items, types },
  preventDefault: jest.fn(),
})

const fileDrag = (files: File[] = [file('a.mp3')], init: DragEventInit = {}) =>
  dragEvent(files, init)

const AUDIO_MIME = 'audio/mpeg'
const AUDIO_ITEM = { name: null, type: AUDIO_MIME }

const textDrag = () => ({
  dataTransfer: { files: [], types: ['text/plain'] },
  preventDefault: jest.fn(),
})

describe('createDropTracker', () => {
  test('activates for file drags and stays active across nested enters', () => {
    const tracker = createDropTracker()
    const event = fileDrag()

    tracker.dragEnter(event)
    tracker.dragEnter(fileDrag())

    expect(tracker.isDragActive).toBe(true)
    expect(event.preventDefault).toHaveBeenCalledTimes(1)

    tracker.dragLeave()
    expect(tracker.isDragActive).toBe(true)

    tracker.dragLeave()
    expect(tracker.isDragActive).toBe(false)
  })

  test('ignores drags without files without preventing default', () => {
    const tracker = createDropTracker()
    const event = textDrag()

    tracker.dragEnter(event)
    tracker.dragOver(event)

    expect(tracker.isDragActive).toBe(false)
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  test('prevents default on dragover only for file drags', () => {
    const tracker = createDropTracker()
    const fileEvent = fileDrag()
    const textEvent = textDrag()

    tracker.dragOver(fileEvent)
    tracker.dragOver(textEvent)

    expect(fileEvent.preventDefault).toHaveBeenCalledTimes(1)
    expect(textEvent.preventDefault).not.toHaveBeenCalled()
  })

  test('returns dropped files, prevents default and resets state', () => {
    const tracker = createDropTracker()
    const files = [file('cover.png'), file('sermon.mp3')]
    tracker.dragEnter(fileDrag())

    const event = fileDrag(files)
    const dropped = tracker.drop(event)

    expect(dropped).toEqual(files)
    expect(event.preventDefault).toHaveBeenCalledTimes(1)
    expect(tracker.isDragActive).toBe(false)
  })

  test('ignores a fileless drop without preventing default or resetting', () => {
    const tracker = createDropTracker()
    tracker.dragEnter(fileDrag())

    const event = textDrag()
    const dropped = tracker.drop(event)

    expect(dropped).toBeNull()
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(tracker.isDragActive).toBe(true)
  })

  test('reset clears the counter and deactivates', () => {
    const tracker = createDropTracker()
    tracker.dragEnter(fileDrag())
    tracker.dragEnter(fileDrag())

    tracker.reset()

    expect(tracker.isDragActive).toBe(false)
    tracker.dragLeave()
    expect(tracker.isDragActive).toBe(false)
  })

  test('collects file items and ignores non-file, empty or nameless-empty items', () => {
    const tracker = createDropTracker()

    tracker.dragEnter(
      fileDrag([], {
        items: [
          item('string', 'text/plain'),
          item('file', ''),
          item('file', 'image/png', 'cover.png'),
        ],
      }),
    )

    expect(tracker.draggedItems).toEqual([{ name: 'cover.png', type: 'image/png' }])
  })

  test('keeps an empty-MIME item that carries a name (FB2 case)', () => {
    const tracker = createDropTracker()

    tracker.dragEnter(fileDrag([], { items: [item('file', '', 'book.fb2'), item('file', '')] }))

    expect(tracker.draggedItems).toEqual([{ name: 'book.fb2', type: '' }])
  })

  test('keeps the last known items while the drag stays active', () => {
    const tracker = createDropTracker()
    tracker.dragEnter(fileDrag([], { items: [item('file', AUDIO_MIME)] }))

    tracker.dragOver(fileDrag([], { items: [] }))

    expect(tracker.draggedItems).toEqual([AUDIO_ITEM])
  })

  test('keeps the same items array reference across repeated identical dragover', () => {
    const tracker = createDropTracker()
    tracker.dragEnter(fileDrag([], { items: [item('file', AUDIO_MIME, 'sermon.mp3')] }))
    const first = tracker.draggedItems

    tracker.dragOver(fileDrag([], { items: [item('file', AUDIO_MIME, 'sermon.mp3')] }))

    expect(tracker.draggedItems).toBe(first)
  })

  test('replaces the items array when the dragged kinds change', () => {
    const tracker = createDropTracker()
    tracker.dragEnter(fileDrag([], { items: [item('file', AUDIO_MIME)] }))
    const first = tracker.draggedItems

    tracker.dragOver(fileDrag([], { items: [item('file', 'image/png', 'cover.png')] }))

    expect(tracker.draggedItems).toEqual([{ name: 'cover.png', type: 'image/png' }])
    expect(tracker.draggedItems).not.toBe(first)
  })

  test('replaces the items array when only the name changes', () => {
    const tracker = createDropTracker()
    tracker.dragEnter(fileDrag([], { items: [item('file', '', 'first.fb2')] }))
    const first = tracker.draggedItems

    tracker.dragOver(fileDrag([], { items: [item('file', '', 'second.fb2')] }))

    expect(tracker.draggedItems).toEqual([{ name: 'second.fb2', type: '' }])
    expect(tracker.draggedItems).not.toBe(first)
  })

  test('clears items when the last nested drag leaves', () => {
    const tracker = createDropTracker()
    tracker.dragEnter(fileDrag([], { items: [item('file', AUDIO_MIME)] }))

    tracker.dragLeave()

    expect(tracker.draggedItems).toEqual([])
  })

  test('clears items on drop and reset', () => {
    const tracker = createDropTracker()
    tracker.dragEnter(fileDrag([], { items: [item('file', 'image/jpeg')] }))
    tracker.drop(fileDrag())

    expect(tracker.draggedItems).toEqual([])

    tracker.dragEnter(fileDrag([], { items: [item('file', 'image/jpeg')] }))
    tracker.reset()

    expect(tracker.draggedItems).toEqual([])
  })
})

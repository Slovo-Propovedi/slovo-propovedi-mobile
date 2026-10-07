import { createDropTracker } from './dropTracker'

const file = (name: string) => ({ name }) as unknown as File

const fileDrag = (files: File[] = [file('a.mp3')]) => ({
  dataTransfer: { files, types: ['Files'] },
  preventDefault: jest.fn(),
})

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
})

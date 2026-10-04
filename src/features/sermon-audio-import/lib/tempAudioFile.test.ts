import { createTempAudioFile, removeTemporaryFile } from './tempAudioFile'

const mockDeleteFile = jest.fn()
let mockFileExists = true
let mockDeleteThrows = false

jest.mock('expo-file-system', () => {
  class MockFile {
    public delete = () => {
      if (mockDeleteThrows) throw new Error('delete failed')

      mockDeleteFile()
    }

    public constructor(_parent: unknown, name: string) {
      this.name = name
      this.uri = `file:///cache/${name}`
    }

    public get exists(): boolean {
      return mockFileExists
    }

    public name: string
    public uri: string
  }

  return { File: MockFile, Paths: { cache: 'file:///cache' } }
})

const TITLE = 'Проповедь о покаянии'

describe('createTempAudioFile', () => {
  test('builds an m4a file in the cache from the video title', () => {
    expect(createTempAudioFile(TITLE).uri).toBe(`file:///cache/${TITLE}.m4a`)
  })

  test('replaces path separators and forbidden characters', () => {
    expect(createTempAudioFile('Проповедь: "о покаянии" / 1').name).toBe(
      'Проповедь- -о покаянии- - 1.m4a',
    )
  })

  test('falls back to a generic name for an empty title', () => {
    expect(createTempAudioFile('   ').name).toBe('youtube-audio.m4a')
  })

  test('truncates an overly long title', () => {
    const file = createTempAudioFile('я'.repeat(120))

    expect(file.name).toBe(`${'я'.repeat(80)}.m4a`)
  })
})

describe('removeTemporaryFile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFileExists = true
    mockDeleteThrows = false
  })

  test('deletes an existing file', () => {
    removeTemporaryFile(createTempAudioFile(TITLE))

    expect(mockDeleteFile).toHaveBeenCalledTimes(1)
  })

  test('does not touch a file that does not exist', () => {
    mockFileExists = false

    removeTemporaryFile(createTempAudioFile(TITLE))

    expect(mockDeleteFile).not.toHaveBeenCalled()
  })

  test('swallows a deletion failure', () => {
    mockDeleteThrows = true

    expect(() => removeTemporaryFile(createTempAudioFile(TITLE))).not.toThrow()
  })
})

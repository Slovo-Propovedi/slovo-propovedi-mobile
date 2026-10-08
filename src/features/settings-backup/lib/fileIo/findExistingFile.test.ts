import { findExistingFile } from './findExistingFile'

type Entry = { kind: 'dir'; name: string } | { kind: 'file'; name: string }

const TARGET = 'target.json'
const isFile = (entry: Entry): entry is Extract<Entry, { kind: 'file' }> => entry.kind === 'file'

describe('findExistingFile', () => {
  test('returns the file entry with the matching name', () => {
    const entries: Entry[] = [
      { kind: 'dir', name: 'other' },
      { kind: 'file', name: TARGET },
    ]

    expect(findExistingFile(entries, TARGET, isFile)).toEqual(entries[1])
  })

  test('ignores a directory with the same name', () => {
    const entries: Entry[] = [{ kind: 'dir', name: TARGET }]

    expect(findExistingFile(entries, TARGET, isFile)).toBeNull()
  })

  test('returns null when no entry matches', () => {
    const entries: Entry[] = [{ kind: 'file', name: 'a.json' }]

    expect(findExistingFile(entries, 'b.json', isFile)).toBeNull()
  })
})

import { FetchedBooksGroupName, FetchedSermonsGroupName } from './bible'

describe('FetchedBooksGroupName', () => {
  test('NotesForPreachers has correct value', () => {
    expect(FetchedBooksGroupName.NotesForPreachers).toBe('notesForPreachers')
  })

  test('TopicalAndThematic has correct value', () => {
    expect(FetchedBooksGroupName.TopicalAndThematic).toBe('topicalAndThematic')
  })

  test('VerseByVerse has correct value', () => {
    expect(FetchedBooksGroupName.VerseByVerse).toBe('verseByVerse')
  })

  test('has exactly 3 members', () => {
    expect(Object.keys(FetchedBooksGroupName)).toHaveLength(3)
  })
})

describe('FetchedSermonsGroupName', () => {
  test('New has correct value', () => {
    expect(FetchedSermonsGroupName.New).toBe('new')
  })

  test('OnBible has correct value', () => {
    expect(FetchedSermonsGroupName.OnBible).toBe('onBible')
  })

  test('Topical has correct value', () => {
    expect(FetchedSermonsGroupName.Topical).toBe('topical')
  })

  test('has exactly 3 members', () => {
    expect(Object.keys(FetchedSermonsGroupName)).toHaveLength(3)
  })
})

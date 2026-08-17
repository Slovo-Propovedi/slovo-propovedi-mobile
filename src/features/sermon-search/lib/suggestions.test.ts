import { getSuggestions } from './suggestions'

const ARTISTS = ['Иван Златоуст', 'Иоанн Кронштадтский', 'Пётр']
const BOOKS = ['Матфея', 'Иоанна', 'Бытие']
const IVAN = 'Иван Златоуст'

describe('getSuggestions', () => {
  test('returns an empty list for an empty query', () => {
    expect(getSuggestions(ARTISTS, BOOKS, '   ', 8)).toEqual([])
  })

  test('matches case-insensitively', () => {
    const suggestions = getSuggestions([IVAN], ['Матфея'], 'ИВАН', 8)

    expect(suggestions).toEqual([{ category: 'artist', value: IVAN }])
  })

  test('ranks startsWith matches above contains matches', () => {
    const suggestions = getSuggestions(['Иоанн', 'Анна'], [], 'анн', 8)

    expect(suggestions).toEqual([
      { category: 'artist', value: 'Анна' },
      { category: 'artist', value: 'Иоанн' },
    ])
  })

  test('limits the number of suggestions', () => {
    const suggestions = getSuggestions(['Иван 1', 'Иван 2', 'Иван 3'], [], 'иван', 2)

    expect(suggestions).toHaveLength(2)
  })

  test('returns an empty list when nothing matches', () => {
    expect(getSuggestions(ARTISTS, BOOKS, 'zzz', 8)).toEqual([])
  })

  test('combines artists and books', () => {
    const suggestions = getSuggestions(['Иван'], ['Иоанна'], 'и', 8)

    expect(suggestions).toEqual([
      { category: 'artist', value: 'Иван' },
      { category: 'book', value: 'Иоанна' },
    ])
  })

  test('places artists before books when ranks are equal', () => {
    const suggestions = getSuggestions(['Иоанн'], ['Ивана'], 'и', 8)

    expect(suggestions).toEqual([
      { category: 'artist', value: 'Иоанн' },
      { category: 'book', value: 'Ивана' },
    ])
  })
})

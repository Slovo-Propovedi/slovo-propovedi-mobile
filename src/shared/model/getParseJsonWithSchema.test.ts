import { z } from 'zod'
import { getParseJsonWithSchema } from './getParseJsonWithSchema'

const nameSchema = z.object({ age: z.number(), name: z.string() })

describe('getParseJsonWithSchema', () => {
  test('returns a function', () => {
    const parse = getParseJsonWithSchema(nameSchema)
    expect(typeof parse).toBe('function')
  })
})

describe('guard clause: null / empty input', () => {
  const parse = getParseJsonWithSchema(nameSchema)

  test('returns undefined for null', () => {
    expect(parse(null)).toBeUndefined()
  })

  test('returns undefined for empty string', () => {
    expect(parse('')).toBeUndefined()
  })
})

describe('valid JSON matching schema', () => {
  const parse = getParseJsonWithSchema(nameSchema)

  test('parses and returns data for object schema', () => {
    const input = JSON.stringify({ age: 30, name: 'Alice' })
    expect(parse(input)).toEqual({ age: 30, name: 'Alice' })
  })
})

describe('invalid JSON string', () => {
  const parse = getParseJsonWithSchema(nameSchema)

  test('returns undefined for malformed JSON', () => {
    expect(parse('{not valid json}')).toBeUndefined()
  })
})

describe('valid JSON failing schema validation', () => {
  const parse = getParseJsonWithSchema(nameSchema)

  test('returns undefined when fields are missing', () => {
    expect(parse(JSON.stringify({ name: 'Alice' }))).toBeUndefined()
  })

  test('returns undefined when types are wrong', () => {
    expect(parse(JSON.stringify({ age: 'thirty', name: 123 }))).toBeUndefined()
  })
})

describe('different schema shapes', () => {
  test('works with a simple primitive schema', () => {
    const parse = getParseJsonWithSchema(z.string())
    expect(parse('"hello"')).toBe('hello')
    expect(parse('42')).toBeUndefined()
  })

  test('works with an array schema', () => {
    const parse = getParseJsonWithSchema(z.array(z.number()))
    expect(parse('[1, 2, 3]')).toEqual([1, 2, 3])
    expect(parse('[1, "two", 3]')).toBeUndefined()
  })
})

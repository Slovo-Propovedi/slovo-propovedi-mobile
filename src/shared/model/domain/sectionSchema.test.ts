import { sectionSchema } from './common'

const validSection = {
  itemsSize: 'large' as const,
  transform: 'high' as const,
}

describe('sectionSchema', () => {
  test('parses minimal section with required fields only', () => {
    const result = sectionSchema.parse(validSection)
    expect(result.itemsSize).toBe('large')
    expect(result.transform).toBe('high')
  })

  test('parses section with all optional fields', () => {
    const fullSection = {
      ...validSection,
      borderRadius: true,
      description: 'Section description',
      id: 'section-1',
      isDescriptionTitleOnSlideLarge: true,
      itemsRows: 3,
      playlists: [],
      title: 'My Section',
      whereIsSlideTitleLocated: 'under',
    }
    const result = sectionSchema.parse(fullSection)
    expect(result.id).toBe('section-1')
    expect(result.itemsRows).toBe(3)
    expect(result.playlists).toHaveLength(0)
  })

  test('parses section with null description and itemsRows', () => {
    const section = { ...validSection, description: null, itemsRows: null }
    const result = sectionSchema.parse(section)
    expect(result.description).toBeNull()
    expect(result.itemsRows).toBeNull()
  })

  test('throws on missing required field: itemsSize', () => {
    const { itemsSize: _, ...rest } = validSection
    expect(() => sectionSchema.parse(rest)).toThrow()
  })

  test('throws on missing required field: transform', () => {
    const { transform: _, ...rest } = validSection
    expect(() => sectionSchema.parse(rest)).toThrow()
  })

  test('throws on invalid enum value for itemsSize', () => {
    const section = { itemsSize: 'huge', transform: 'high' }
    expect(() => sectionSchema.parse(section)).toThrow()
  })

  test('throws on invalid enum value for transform', () => {
    const section = { itemsSize: 'large', transform: 'extra' }
    expect(() => sectionSchema.parse(section)).toThrow()
  })
})

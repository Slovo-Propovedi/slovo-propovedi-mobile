import { sermonsMocks } from 'shared/api/generated'
import { mapSermonEntityToSermonData } from './mapSermonEntityToSermonData'

describe('mapSermonEntityToSermonData', () => {
  test('normalizes empty-string artwork to null', () => {
    const entity = sermonsMocks.getSermonControllerFindOneResponseMock({ artwork: '' })

    expect(mapSermonEntityToSermonData(entity).artwork).toBeNull()
  })

  test('keeps a non-empty artwork url', () => {
    const artwork = 'https://example.org/sermon.jpg'
    const entity = sermonsMocks.getSermonControllerFindOneResponseMock({ artwork })

    expect(mapSermonEntityToSermonData(entity).artwork).toBe(artwork)
  })
})

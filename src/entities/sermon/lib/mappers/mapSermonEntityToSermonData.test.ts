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

  test('projects a non-empty artworkBlurhash', () => {
    const entity = sermonsMocks.getSermonControllerFindOneResponseMock({
      artworkBlurhash: 'LKO2?wKcjK',
    })

    expect(mapSermonEntityToSermonData(entity).artworkBlurhash).toBe('LKO2?wKcjK')
  })

  test('normalizes empty-string artworkBlurhash to null', () => {
    const entity = sermonsMocks.getSermonControllerFindOneResponseMock({ artworkBlurhash: '' })

    expect(mapSermonEntityToSermonData(entity).artworkBlurhash).toBeNull()
  })

  test('normalizes an absent artworkBlurhash to null', () => {
    const entity = sermonsMocks.getSermonControllerFindOneResponseMock({ artworkBlurhash: null })

    expect(mapSermonEntityToSermonData(entity).artworkBlurhash).toBeNull()
  })
})

import { predictedMimeGroups } from './predictedMimeGroups'

const sorted = (groups: ReadonlySet<string>) => [...groups].sort()

describe('predictedMimeGroups', () => {
  test('maps image, audio and text MIME types to their groups', () => {
    expect(
      sorted(predictedMimeGroups(['image/jpeg', 'audio/mpeg', 'application/pdf', 'text/plain'])),
    ).toEqual(['audio', 'image', 'text'])
  })

  test('maps XML/FB2 MIME types (application/xml, text/xml) to text', () => {
    expect(sorted(predictedMimeGroups(['application/xml', 'text/xml']))).toEqual(['text'])
  })

  test('maps generic application/octet-stream (best-effort for FB2) to text', () => {
    expect(sorted(predictedMimeGroups(['application/octet-stream']))).toEqual(['text'])
  })

  test('deduplicates repeated groups', () => {
    expect(sorted(predictedMimeGroups(['image/png', 'image/webp']))).toEqual(['image'])
  })

  test('ignores unknown MIME types', () => {
    expect(sorted(predictedMimeGroups(['application/zip', 'video/mp4']))).toEqual([])
  })
})

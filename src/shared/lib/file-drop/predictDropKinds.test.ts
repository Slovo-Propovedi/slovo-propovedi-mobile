import { predictDropKinds } from './predictDropKinds'

const sorted = (kinds: ReadonlySet<string>) => [...kinds].sort()

describe('predictDropKinds', () => {
  test('classifies by extension when the name is known (FB2 without a MIME)', () => {
    expect(sorted(predictDropKinds([{ name: 'book.fb2', type: '' }]))).toEqual(['text'])
  })

  test('falls back to the MIME group when the name is missing', () => {
    expect(sorted(predictDropKinds([{ name: null, type: 'audio/mpeg' }]))).toEqual(['audio'])
  })

  test('prefers the extension over a misleading MIME type', () => {
    expect(
      sorted(predictDropKinds([{ name: 'cover.png', type: 'application/octet-stream' }])),
    ).toEqual(['image'])
  })

  test('collects every predicted kind and ignores unknown items', () => {
    expect(
      sorted(
        predictDropKinds([
          { name: 'cover.jpg', type: 'image/jpeg' },
          { name: null, type: 'application/pdf' },
          { name: 'archive.zip', type: 'application/zip' },
          { name: null, type: 'application/octet-stream' },
        ]),
      ),
    ).toEqual(['image', 'text'])
  })
})

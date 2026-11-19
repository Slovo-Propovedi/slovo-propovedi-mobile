import { createCtx } from '@reatom/framework'
import { searchInputRequestAtom, searchQueryAtom, typeSearchInput } from './model'
import { resetSearchSession } from './model-session'

describe('sermon-search model', () => {
  test('typeSearchInput sets the query and asks the visible input to adopt the text', () => {
    const ctx = createCtx()
    const partialQuery = 'ли'

    typeSearchInput(ctx, partialQuery)

    expect(ctx.get(searchQueryAtom)).toBe(partialQuery)
    expect(ctx.get(searchInputRequestAtom)?.text).toBe(partialQuery)

    // A repeated identical request still gets a fresh nonce so the input re-adopts it.
    const firstNonce = ctx.get(searchInputRequestAtom)?.nonce ?? 0
    typeSearchInput(ctx, partialQuery)

    expect(ctx.get(searchInputRequestAtom)?.nonce).toBe(firstNonce + 1)
  })

  test('resetSearchSession clears the query and pushes an empty input request', async () => {
    const ctx = createCtx()
    searchQueryAtom(ctx, 'вера')
    typeSearchInput(ctx, 'вера')

    await resetSearchSession(ctx)

    expect(ctx.get(searchQueryAtom)).toBe('')
    expect(ctx.get(searchInputRequestAtom)).toMatchObject({ text: '' })
  })
})

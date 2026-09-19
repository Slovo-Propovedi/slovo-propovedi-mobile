import { historyAtom } from 'entities/listening-history/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { currentAudioAtom, setDurationAction } from '../../../model'
import { applyPartialDuration } from './partialDuration'

jest.mock('../../../model', () => ({
  ...jest.requireActual('../../../model'),
  setDurationAction: jest.fn(),
}))

const mockedSetDurationAction = jest.mocked(setDurationAction)

const AUDIO = {
  artist: 'Author',
  artwork: null,
  audioUrl: 'https://example.com/a.mp3',
  id: 'sermon-1',
  title: 'Test Sermon',
}
const OTHER_AUDIO = { ...AUDIO, id: 'other' }
const PARTIAL_DURATION_MS = 45000
const FULL_DURATION_MS = 600000

const historyEntryWith = (durationMs: number, sermon = AUDIO) => ({
  durationMs,
  lastPlayedAt: 1,
  playlist: { artwork: null, id: 'p', sermons: [sermon], title: 'P' },
  positionMs: 0,
})

describe('applyPartialDuration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    currentAudioAtom(ctx, AUDIO)
    historyAtom(ctx, [])
  })

  test('writes the full duration from history when the entry has durationMs > 0', () => {
    historyAtom(ctx, [historyEntryWith(FULL_DURATION_MS)])

    applyPartialDuration(PARTIAL_DURATION_MS)

    expect(mockedSetDurationAction).toHaveBeenCalledWith(ctx, FULL_DURATION_MS)
  })

  test('falls back to the partial duration when history has no matching entry', () => {
    historyAtom(ctx, [historyEntryWith(FULL_DURATION_MS, OTHER_AUDIO)])

    applyPartialDuration(PARTIAL_DURATION_MS)

    expect(mockedSetDurationAction).toHaveBeenCalledWith(ctx, PARTIAL_DURATION_MS)
  })

  test('falls back to the partial duration when the entry durationMs is 0', () => {
    historyAtom(ctx, [historyEntryWith(0)])

    applyPartialDuration(PARTIAL_DURATION_MS)

    expect(mockedSetDurationAction).toHaveBeenCalledWith(ctx, PARTIAL_DURATION_MS)
  })

  test('writes nothing when there is no current audio', () => {
    currentAudioAtom(ctx, null)

    applyPartialDuration(PARTIAL_DURATION_MS)

    expect(mockedSetDurationAction).not.toHaveBeenCalled()
  })
})

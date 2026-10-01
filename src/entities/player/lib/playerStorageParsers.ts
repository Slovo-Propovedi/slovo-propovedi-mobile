import { playlistDataSchema } from 'entities/playlist/@x/player'
import { audioPlayerDataSchema } from 'entities/sermon/@x/player'
import { getParseJsonWithSchema } from 'shared/model'
import { playbackProgressSchema } from './playbackProgress'

// Zod issues are logged for diagnosability. A parse mismatch is NOT a crash, so
// it must not leave the startup-guard counter incremented — a completed restore
// resets the counter (see initializePlayer).
export const parseAudioPlayerData = getParseJsonWithSchema(audioPlayerDataSchema, issues =>
  console.warn('[initializePlayer] CURRENT_AUDIO failed zod validation:', issues),
)
export const parsePlaylistData = getParseJsonWithSchema(playlistDataSchema, issues =>
  console.warn('[initializePlayer] CURRENT_PLAYLIST failed zod validation:', issues),
)
export const parsePlaybackProgress = getParseJsonWithSchema(playbackProgressSchema)

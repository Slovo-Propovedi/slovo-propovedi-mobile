import { audioPlayerDataSchema } from 'entities/sermon'
import { getParseJsonWithSchema, playlistDataSchema } from 'shared/model'

export const parseAudioPlayerData = getParseJsonWithSchema(audioPlayerDataSchema)
export const parsePlaylistData = getParseJsonWithSchema(playlistDataSchema)

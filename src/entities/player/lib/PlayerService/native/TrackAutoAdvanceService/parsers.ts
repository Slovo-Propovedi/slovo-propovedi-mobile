import { playlistDataSchema } from 'entities/playlist/@x/player'
import { audioPlayerDataSchema } from 'entities/sermon'
import { getParseJsonWithSchema } from 'shared/model'

export const parseAudioPlayerData = getParseJsonWithSchema(audioPlayerDataSchema)
export const parsePlaylistData = getParseJsonWithSchema(playlistDataSchema)

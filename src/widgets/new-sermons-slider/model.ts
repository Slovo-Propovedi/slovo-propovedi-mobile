import { action, atom } from '@reatom/framework'
import { API } from 'shared/api'
import { getBookLinkAsString } from 'shared/lib/string'
import { FetchedSermonsGroupName, type PlaylistData, type SermonData } from 'shared/model'

export const newSermonsAtom = atom<PlaylistData[]>([], 'newSermonsAtom')

export const getNewSermons = action(async ctx => {
  const list = await API.sermons.getPlaylistsOnSermonsGroup(FetchedSermonsGroupName.New)

  const mappedList = list?.map<PlaylistData>(playlist => ({
    ...playlist,
    list: playlist.list.map<SermonData>(el => {
      const { artist, artwork, audioUrl, description, id, textFileUrl, youtubeUrl } = el

      return {
        artist,
        artwork,
        audioUrl,
        description,
        id,
        textFileUrl,
        title: getBookLinkAsString(el),
        youtubeUrl,
      }
    }),
  }))

  const result = mappedList || []
  await ctx.schedule(() => {
    newSermonsAtom(ctx, result)
  })
}, 'getNewSermons')

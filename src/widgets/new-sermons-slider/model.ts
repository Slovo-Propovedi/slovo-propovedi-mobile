import { action, atom } from '@reatom/framework'
import { API } from 'shared/api'
import { getBookLinkAsString } from 'shared/lib/string'
import { FetchedSermonsGroupName, type PlaylistData, type SermonData } from 'shared/model'

export const newSermonsAtom = atom<PlaylistData[]>([], 'newSermonsAtom')

export const getNewSermons = action(async ctx => {
  const list = await API.sermons.getPlaylistsOnSermonsGroup(FetchedSermonsGroupName.New)

  const mappedList = list?.map<PlaylistData>(playlist => ({
    ...playlist,
    sermons: playlist.sermons.map<SermonData>(el => ({
      ...el,
      title: getBookLinkAsString({ title: el.title }),
    })),
  }))

  const result = mappedList || []
  await ctx.schedule(() => {
    newSermonsAtom(ctx, result)
  })
}, 'getNewSermons')

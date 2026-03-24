import { action, atom } from '@reatom/framework'
import { API } from 'shared/api'
import { getBookLinkAsString } from 'shared/lib/string'
import { FetchedSermonsGroupName, type PlaylistData, type SermonData } from 'shared/model'

export const listenEveryDayAtom = atom<PlaylistData[]>([], 'listenEveryDayAtom')

export const getListenEveryDay = action(async ctx => {
  const list = await API.sermons.getPlaylistsOnSermonsGroup(FetchedSermonsGroupName.OnBible)
  const mappedList = list?.map<PlaylistData>(playlist => ({
    ...playlist,
    list: playlist.list.map<SermonData>(el => {
      const { artist, audioUrl, description, id, textFileUrl, youtubeUrl } = el

      return {
        artist,
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
    listenEveryDayAtom(ctx, result)
  })
}, 'getListenEveryDay')

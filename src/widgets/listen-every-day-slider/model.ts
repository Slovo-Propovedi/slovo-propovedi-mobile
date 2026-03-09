import { action, atom } from '@reatom/framework'
import { API } from 'shared/api'
import { getBookLinkAsString } from 'shared/lib'
import { FetchedSermonsGroupName } from 'shared/types'
import type { PlaylistData, SermonData } from 'shared/types'

export const listenEveryDayAtom = atom<PlaylistData[]>([], 'listenEveryDayAtom')

export const getListenEveryDay = action(async ctx => {
  const list = await API.sermons.getPlaylistsOnSermonsGroup(FetchedSermonsGroupName.OnBible)
  const mappedList = list?.map<PlaylistData>(playlist => ({
    ...playlist,
    list: playlist.list.map<SermonData>(el => {
      const { audioUrl, description, id, textFileUrl, youtubeUrl } = el

      return {
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

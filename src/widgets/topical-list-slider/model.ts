import { action, atom } from '@reatom/framework'
import { API } from 'shared/api'
import { getBookLinkAsString } from 'shared/lib/string'
import { FetchedSermonsGroupName, type PlaylistData, type SermonData } from 'shared/model'

export const TopicalListSliderAtom = atom<PlaylistData[]>([], 'topical-list-sliderAtom')

export const getTopicalListSlider = action(async ctx => {
  const list = await API.sermons.getPlaylistsOnSermonsGroup(FetchedSermonsGroupName.Topical)

  const mappedList = list?.map<PlaylistData>(playlist => ({
    ...playlist,
    sermons: playlist.sermons.map<SermonData>(el => ({
      ...el,
      title: getBookLinkAsString({ title: el.title }),
    })),
  }))

  const result = mappedList || []

  await ctx.schedule(() => {
    TopicalListSliderAtom(ctx, result)
  })

  return result
}, 'getTopicalListSlider')

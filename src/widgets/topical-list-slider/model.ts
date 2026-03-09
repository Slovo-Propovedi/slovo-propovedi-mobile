import { action, atom } from '@reatom/framework'
import { API } from 'shared/api'
import { getBookLinkAsString } from 'shared/lib'
import { FetchedSermonsGroupName, type PlaylistData, type SermonData } from 'shared/types'

export const TopicalListSliderAtom = atom<PlaylistData[]>([], 'topical-list-sliderAtom')

export const getTopicalListSlider = action(async () => {
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

  return mappedList || []
}, 'getTopicalListSlider')

import axios from 'axios'
import { PLAYLIST_ID } from './constants'

export async function getYoutubePlaylistInfo(accessToken: string) {
  const rootURL = 'https://www.googleapis.com/youtube/v3/playlists'

  const values = {
    part: 'contentDetails',
    id: PLAYLIST_ID,
  }

  const qs = new URLSearchParams(values)

  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
  const res = await axios.get(`${rootURL}?${qs.toString()}`, config)

  return {
    data: res.data,
    itemCount: res.data.items[0].contentDetails.itemCount,
  }
}

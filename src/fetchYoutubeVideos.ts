import axios from 'axios'

export async function fetchYoutubeVideos(accessToken: string) {
  const rootURL = 'https://www.googleapis.com/youtube/v3/playlistItems'

  const values = {
    part: 'contentDetails',
    maxResults: '10',
    playlistId: 'PLogYAbXxpcswCx7liCyjv05nGPggNiLOh',
  }

  const qs = new URLSearchParams(values)

  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
  const res = await axios.get(`${rootURL}?${qs.toString()}`, config)

  return res.data
}

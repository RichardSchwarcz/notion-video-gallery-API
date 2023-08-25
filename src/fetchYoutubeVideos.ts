import axios from 'axios'

export async function fetchYoutubeVideos(accessToken: string) {
  const rootURL = 'https://www.googleapis.com/youtube/v3/playlistItems'

  const values = {
    part: 'snippet',
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

type FetchPlaylistOptions = {
  part: string
  maxResults: string
  playlistId: string
  pageToken?: string
}

function generateQueryString(options: FetchPlaylistOptions) {
  const commonOptions = {
    part: options.part,
    maxResults: options.maxResults,
    playlistId: options.playlistId,
  }

  if (options.pageToken !== undefined) {
    return new URLSearchParams({
      ...commonOptions,
      pageToken: options.pageToken,
    })
  }

  return new URLSearchParams(commonOptions)
}

export async function fetchYoutubeVideosRecursively(
  accessToken: string,
  nextPageToken: string | undefined,
  allVideos: any[] = []
) {
  const rootURL = 'https://www.googleapis.com/youtube/v3/playlistItems'

  const options = {
    part: 'snippet',
    maxResults: '10',
    playlistId: 'PLogYAbXxpcswCx7liCyjv05nGPggNiLOh',
    pageToken: nextPageToken,
  }

  const qs = generateQueryString(options)

  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }

  try {
    const res = await axios.get(`${rootURL}?${qs.toString()}`, config)
    const videos = res.data.items || []
    allVideos.push(...videos)

    if (res.data.nextPageToken) {
      return fetchYoutubeVideosRecursively(
        accessToken,
        res.data.nextPageToken,
        allVideos
      )
    }

    return allVideos
  } catch (error) {
    console.log('Error fetching playlist items')
    throw error
  }
}

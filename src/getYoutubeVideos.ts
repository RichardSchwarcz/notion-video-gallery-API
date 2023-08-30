import axios from 'axios'
import { VideosOptions } from './types/videoTypes'

const ENDPOINT = {
  playlistItems: 'playlistItems',
  videos: 'videos',
} as const

type Endpoint = keyof typeof ENDPOINT

// ------------- FUNCTIONS ----------------

export async function getYoutubeVideos(
  accessToken: string,
  endpoint: Endpoint,
  qs: URLSearchParams
) {
  const rootURL = `https://www.googleapis.com/youtube/v3/${endpoint}`

  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
  const res = await axios.get(`${rootURL}?${qs.toString()}`, config)

  return res.data
}

// ------------------------------------------

export function generateQueryString(options: VideosOptions): URLSearchParams {
  const commonOptions = {
    part: options.part,
    maxResults: options.maxResults,
  }

  let queryStringParams

  if (options.id) {
    queryStringParams = {
      ...commonOptions,
      id: options.id,
    }
  }

  if (options.playlistId) {
    queryStringParams = {
      ...commonOptions,
      playlistId: options.playlistId,
    }
  }

  if (!options.id && !options.playlistId) {
    throw new Error('Error : id or playlistId must be provided')
  }

  if (options.pageToken) {
    return new URLSearchParams({
      ...queryStringParams,
      pageToken: options.pageToken,
    })
  }

  return new URLSearchParams(queryStringParams)
}

// --------------------------------------------

export async function getYoutubeVideosRecursively(
  accessToken: string,
  endpoint: Endpoint,
  options: VideosOptions,
  nextPageToken: string | undefined = undefined,
  allVideos: any[] = []
) {
  const options_ = {
    ...options,
    pageToken: nextPageToken,
  }

  try {
    const qs = generateQueryString(options_)

    const data = await getYoutubeVideos(accessToken, endpoint, qs)
    const items = data.items || []

    items.forEach((item: any) => {
      allVideos.push(item)
    })

    if (data.nextPageToken) {
      return getYoutubeVideosRecursively(
        accessToken,
        endpoint,
        options_,
        data.nextPageToken,
        allVideos
      )
    }

    return allVideos
  } catch (error) {
    console.log('Error fetching youtube videos')
    throw error
  }
}

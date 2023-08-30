import axios from 'axios'
import { parse } from 'cookie'
import { Request, Response } from 'express'
import { getYoutubeVideosRecursively } from '../getYoutubeVideos'
import { postDelayedRequests } from '../utils/postDelayedRequests'
import {
  postToNotionDatabase,
  postToNotionSnapshot,
} from '../postToNotionDatabase'
import { getVideosIds, getYoutubeVideosDuration } from '../utils/youtubeHelpers'
import { formatYoutubeVideos } from '../utils/youtubeHelpers'
import {
  GetVideosOptions,
  VideoDuration,
  VideoInfo,
  VideoSchema,
} from '../types/videoTypes'

// ------------- HANDLERS ----------------

export async function handleGetNotionVideos(req: Request, res: Response) {
  const url = `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`

  const options = {
    headers: {
      Authorization: `Bearer ${process.env.NOTION_SECRET}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  }

  try {
    const response = await axios.post(url, { page_size: 100 }, options)
    const data = await response.data

    res.json({
      entries: data,
    })
  } catch (error: any) {
    console.log(error, 'Failed to fetch notion database items')
  }
}

// ---------------------------------------------

export async function handleInitialLoad(req: Request, res: Response) {
  const cookieHeader = req.headers.cookie

  if (!cookieHeader || typeof cookieHeader !== 'string') {
    console.log('Cookie header is missing or not a string.')
    return
  }

  const parsedCookies = parse(cookieHeader)
  const { access_token } = parsedCookies

  try {
    // fetch all videos from playlist
    const videosOptions: GetVideosOptions = {
      part: 'snippet',
      maxResults: '50',
      playlistId: 'PLogYAbXxpcswCx7liCyjv05nGPggNiLOh',
    }

    const rawPlaylistItems = await getYoutubeVideosRecursively(
      access_token,
      'playlistItems',
      videosOptions
    )

    const formattedVideos = formatYoutubeVideos(rawPlaylistItems)

    const videoIds = getVideosIds(formattedVideos)
    // fetch videos by ID. In playlist items there is no duration property
    const videosDataOptions: GetVideosOptions = {
      part: 'contentDetails',
      maxResults: '50',
      id: videoIds,
    }

    const rawVideosData = await getYoutubeVideosRecursively(
      access_token,
      'videos',
      videosDataOptions
    )

    const durations = getYoutubeVideosDuration(rawVideosData)

    const finalVideos = combineVideoArrays(formattedVideos, durations)

    const wrapIds = (videoIds: string[]) => {
      return videoIds.map((id) => {
        return { id }
      })
    }

    res.json({ allVideos: wrapIds(videoIds) })

    // // load notion database
    // console.log('Starting API requests...')
    // try {
    //   const post = await postDelayedRequests(
    //     finalVideos,
    //     postToNotionDatabase,
    //     350
    //   )
    //   console.log('API requests completed:', post)
    // } catch (error) {
    //   console.error('Error:', error)
    // } finally {
    //   console.log('All operations completed.')
    // }

    // create notion snapshot
    console.log('Starting API requests...')
    try {
      const post = await postDelayedRequests(
        wrapIds(videoIds),
        postToNotionSnapshot,
        350
      )
      console.log('API requests completed:', post)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      console.log('All operations completed.')
    }
  } catch (error: any) {
    const errorMessage = `${error.response.status} ${error.response.statusText}`

    if (errorMessage == '401 Unauthorized') {
      res.redirect('/api/error/unauthorized')
    }
  }
}

// ---------------------------------------------

function combineVideoArrays(
  videoInfoArray: VideoInfo[],
  durationArray: VideoDuration[]
): VideoSchema[] {
  const combinedArray = []

  for (const videoInfo of videoInfoArray) {
    const matchingDuration = durationArray.find(
      (duration: VideoDuration) => duration.id === videoInfo.videoId
    )

    if (matchingDuration) {
      combinedArray.push({
        ...videoInfo,
        duration: matchingDuration.duration,
      })
    }
  }

  return combinedArray
}

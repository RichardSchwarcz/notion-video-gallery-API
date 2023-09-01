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
import { formatPlaylistItems } from '../utils/youtubeHelpers'
import {
  VideosOptions,
  VideoDuration,
  PlaylistItem,
  VideoSchema,
  RawPlaylistItem,
  RawVideoData,
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
    const getNotionData = async () => {
      // fetch all videos from playlist
      const videosOptions: VideosOptions = {
        part: 'snippet',
        maxResults: '50',
        playlistId: 'PLogYAbXxpcswCx7liCyjv05nGPggNiLOh',
      }

      const rawPlaylistItems: RawPlaylistItem[] =
        await getYoutubeVideosRecursively(
          access_token,
          'playlistItems',
          videosOptions
        )

      const formattedVideos: PlaylistItem[] =
        formatPlaylistItems(rawPlaylistItems)

      // fetch videos by ID. In playlist items there is no duration property
      const videosDataOptions: VideosOptions = {
        part: 'contentDetails',
        maxResults: '50',
        id: getVideosIds(formattedVideos),
      }

      const rawVideosData: RawVideoData[] = await getYoutubeVideosRecursively(
        access_token,
        'videos',
        videosDataOptions
      )

      const durations: VideoDuration[] = getYoutubeVideosDuration(rawVideosData)

      return {
        formattedVideos,
        durations,
        rawPlaylistItems,
        rawVideosData,
      }
    }

    res.json({ allVideos: 'formatSnapshotData(rawPlaylistItems)' })

    //------------------------------------------------------------

    const { rawPlaylistItems, formattedVideos, durations } =
      await getNotionData()

    const notionSnapshotData = formatSnapshotData(rawPlaylistItems)
    const notionMainData = combineVideoArrays(formattedVideos, durations)

    // load notion database
    console.log('Starting API requests...')
    try {
      const post = await postDelayedRequests(
        notionMainData,
        postToNotionDatabase,
        350
      )
      console.log('API requests completed:', post)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      console.log('All operations completed.')
    }

    // create notion snapshot
    console.log('Starting API requests...')
    try {
      const post = await postDelayedRequests(
        notionSnapshotData,
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
  formattedVideos: PlaylistItem[],
  durations: VideoDuration[]
): VideoSchema[] {
  const combinedArray = []

  for (const videoInfo of formattedVideos) {
    const matchingDuration = durations.find(
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

function formatSnapshotData(rawPlaylistItems: RawPlaylistItem[]) {
  return rawPlaylistItems.map((playlistItem: RawPlaylistItem) => {
    return {
      title: playlistItem.snippet.title,
      url: `https://www.youtube.com/watch?v=${playlistItem.snippet.resourceId.videoId}`,
      playlistItemId: playlistItem.id,
    }
  })
}

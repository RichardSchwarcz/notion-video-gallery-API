import { parse } from 'cookie'
import { Request, Response } from 'express'
import { fetchYoutubeVideos, generateQueryString } from '../fetchYoutubeVideos'
import { FetchVideosOptions } from '../types/videoTypes'

// ------------- FUNCTIONS ----------------

export async function handleGetYoutubeVideos(req: Request, res: Response) {
  const cookieHeader = req.headers.cookie

  if (!cookieHeader || typeof cookieHeader !== 'string') {
    console.log('Cookie header is missing or not a string.')
    return
  }

  const parsedCookies = parse(cookieHeader)
  const { access_token } = parsedCookies

  try {
    const options: FetchVideosOptions = {
      part: 'snippet',
      maxResults: '50',
      playlistId: 'PLogYAbXxpcswCx7liCyjv05nGPggNiLOh',
    }

    const qs = generateQueryString(options)

    const videos = await fetchYoutubeVideos(access_token, 'playlistItems', qs)

    res.json({
      videos: videos,
    })
  } catch (error: any) {
    console.log(error.message)
  }
}

import { parse } from 'cookie'
import { Request, Response } from 'express'
import { getYoutubeVideos, generateQueryString } from '../getYoutubeVideos'
import { VideosOptions } from '../types/videoTypes'
import { PLAYLIST_ID } from '../constants'

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
    const options: VideosOptions = {
      part: 'snippet',
      maxResults: '50',
      playlistId: PLAYLIST_ID,
    }

    const qs = generateQueryString(options)

    const playlistItems = await getYoutubeVideos(
      access_token,
      'playlistItems',
      qs
    )

    res.json({
      videos: playlistItems,
    })
  } catch (error: any) {
    console.log(error.message)
  }
}

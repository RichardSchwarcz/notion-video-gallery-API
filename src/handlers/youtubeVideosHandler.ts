import { parse } from 'cookie'
import { Request, Response } from 'express'
import { fetchYoutubeVideos } from '../fetchYoutubeVideos'

export async function handleGetYoutubeVideos(req: Request, res: Response) {
  const cookieHeader = req.headers.cookie

  if (!cookieHeader || typeof cookieHeader !== 'string') {
    console.log('Cookie header is missing or not a string.')
    return
  }

  const parsedCookies = parse(cookieHeader)
  const { access_token } = parsedCookies

  try {
    const videos = await fetchYoutubeVideos(access_token)
    res.json({
      videos: videos,
    })
  } catch (error: any) {
    const errorMessage = `${error.response.status} ${error.response.statusText}`

    if (errorMessage == '401 Unauthorized') {
      res.redirect('/api/error/unauthorized')
    }
  }
}

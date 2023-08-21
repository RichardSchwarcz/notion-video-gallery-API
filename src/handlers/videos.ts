import { parse } from 'cookie'
import { Request, Response } from 'express'
import { fetchYoutubeVideos } from '../fetchYoutubeVideos'

export async function getVideos(req: Request, res: Response) {
  const cookieHeader = req.headers.cookie

  if (!cookieHeader || typeof cookieHeader !== 'string') {
    console.log('Cookie header is missing or not a string.')
    return
  }

  const parsedCookies = parse(cookieHeader)
  const accessToken = parsedCookies.access

  if (!accessToken || typeof accessToken !== 'string') {
    console.log('Access token cookie is missing or not a string.')
    res.redirect('/api/loginURL')
    return
  }

  try {
    const videos = await fetchYoutubeVideos(accessToken)
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

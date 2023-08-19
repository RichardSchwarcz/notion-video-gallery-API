import { Request, Response } from 'express'
import { parse } from 'cookie'
import router from './router'
import { getVideos } from '../getVideos'

router.get('/videos', async (req: Request, res: Response) => {
  const cookieHeader = req.headers.cookie

  if (!cookieHeader || typeof cookieHeader !== 'string') {
    console.log('Cookie header is missing or not a string.')
    return
  }

  const parsedCookies = parse(cookieHeader)
  const accessToken = parsedCookies.access

  if (!accessToken || typeof accessToken !== 'string') {
    console.log('Access token cookie is missing or not a string.')
    res.redirect('/auth')
    return
  }

  try {
    const videos = await getVideos(accessToken)
    res.json({
      videos: videos,
    })
  } catch (error: any) {
    const errorMessage = `${error.response.status} ${error.response.statusText}`

    if (errorMessage == '401 Unauthorized') {
      res.redirect('/api/error/unauthorized')
    }
  }
})

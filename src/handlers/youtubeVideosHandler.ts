import { parse } from 'cookie'
import { Request, Response } from 'express'
import { fetchYoutubeVideos } from '../fetchYoutubeVideos'

// ! REFACTOR: divide this function into  two functions. Cookie validation and Fetch
// ! validate cookies inside of a middleware

export async function handleGetVideos(req: Request, res: Response) {
  const cookieHeader = req.headers.cookie

  if (!cookieHeader || typeof cookieHeader !== 'string') {
    console.log('Cookie header is missing or not a string.')
    return
  }

  const parsedCookies = parse(cookieHeader)
  const accessToken = parsedCookies.access

  if (!accessToken || typeof accessToken !== 'string') {
    console.log('Access token cookie is missing or not a string.')
    res.redirect('/api/youtube/auth')
    return
  }

  try {
    const videos = await fetchYoutubeVideos(accessToken)
    res.json({
      videos: videos,
    })
  } catch (error: any) {
    const errorMessage = `${error.response.status} ${error.response.statusText}`

    // ! try res.get(error)
    // res.status(404).send('Sorry, we cannot find that!') --> set status to 404 and send sorry

    if (errorMessage == '401 Unauthorized') {
      res.redirect('/api/error/unauthorized')
    }
  }
}

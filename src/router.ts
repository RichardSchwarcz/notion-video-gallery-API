import { NextFunction, Request, Response, Router } from 'express'
import {
  handleGetOAuthTokens,
  handleOAuthURL,
  handleRefreshAccessToken,
} from './handlers/googleOAuthHandler'
import { handleGetYoutubeVideos } from './handlers/youtubeVideosHandler'
import { parse } from 'cookie'
import { handleGetNotionVideos } from './handlers/notionDatabaseHandler'
import {
  fetchYoutubeVideos,
  fetchYoutubeVideosRecursively,
} from './fetchYoutubeVideos'
import { getYoutubePlaylistInfo } from './getYoutubePlaylistInfo'
import { postToNotionDatabase } from './postNotionEntries'
import { postDelayedRequests } from './utils/postDelayedRequests'

const router = Router()

// cookies validation
router.use(
  ['/youtube/videos', '/notion'],
  (req: Request, res: Response, next: NextFunction) => {
    const cookieHeader = req.headers.cookie

    // check cookies header
    if (!cookieHeader || typeof cookieHeader !== 'string') {
      console.log(
        'Cookie header is missing or not a string. Redirecting to auth from middleware'
      )
      res.redirect('/api/youtube/auth')
      return
    }

    const parsedCookies = parse(cookieHeader)
    const { access_token, refresh_token } = parsedCookies

    // check access token
    if (!access_token || typeof access_token !== 'string') {
      console.log(
        'Access token is missing or not a string. Redirecting to refresh from middleware'
      )
      res.redirect('/api/youtube/auth/refresh')
      return
    }

    // check refresh token
    if (!refresh_token || typeof refresh_token !== 'string') {
      console.log(
        'Refresh token is missing or not a string. Redirecting to auth from middleware'
      )
      res.redirect('/api/youtube/auth')
      return
    }

    next()
  }
)

// auth
router.get('/youtube/auth', handleOAuthURL)

router.get('/youtube/auth/redirect', handleGetOAuthTokens)

// ! add restricted middleware. no post request allowed without refresh token
router.get('/youtube/auth/refresh', handleRefreshAccessToken)

// youtube videos
// ! add restricted middleware. no post request allowed without access token
router.get('/youtube/videos', handleGetYoutubeVideos)

// notion database
router.get('/notion/videos', handleGetNotionVideos)

// load notion database
router.get('/notion/load', async (req: Request, res: Response) => {
  const cookieHeader = req.headers.cookie

  if (!cookieHeader || typeof cookieHeader !== 'string') {
    console.log('Cookie header is missing or not a string.')
    return
  }

  const parsedCookies = parse(cookieHeader)
  const { access_token } = parsedCookies

  try {
    // fetch all videos
    const videos = await fetchYoutubeVideosRecursively(access_token, undefined)

    res.json({ allVideos: videos })

    // load notion database
    console.log('Starting API requests...')
    try {
      const post = await postDelayedRequests(videos, postToNotionDatabase, 350)
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
})

// error
router.get('/error/unauthorized', (res: Response) => {
  res.send(
    `
  <div>
    <a href="/api/auth/refresh">Renew Session</a>
    <a href="/api/auth">Log in again</a>
  </div>
  `
  )
})

export default router

import { NextFunction, Request, Response, Router } from 'express'
import {
  handleGetOAuthTokens,
  handleOAuthURL,
  handleRefreshAccessToken,
} from './handlers/googleOAuthHandler'
import { handleGetYoutubeVideos } from './handlers/youtubeVideosHandler'
import axios from 'axios'
import { parse } from 'cookie'
import { handleGetNotionVideos } from './handlers/notionDatabaseHandler'

const router = Router()

// cookies validation
router.use(
  '/youtube/videos',
  (req: Request, res: Response, next: NextFunction) => {
    const cookieHeader = req.headers.cookie

    // check cookies header
    if (!cookieHeader || typeof cookieHeader !== 'string') {
      console.log('Cookie header is missing or not a string.')
      res.redirect('/api/youtube/auth')
      return
    }

    const parsedCookies = parse(cookieHeader)
    const { access_token, refresh_token } = parsedCookies

    // check access token
    if (!access_token || typeof access_token !== 'string') {
      console.log('Access token is missing or not a string.')
      res.redirect('/api/youtube/auth/refresh')
      return
    }

    // check refresh token
    if (!refresh_token || typeof refresh_token !== 'string') {
      console.log('Refresh token is missing or not a string.')
      res.redirect('/api/youtube/auth')
      return
    }

    next()
  }
)

// auth
router.get('/youtube/auth', handleOAuthURL)

router.get('/youtube/auth/redirect', handleGetOAuthTokens)

router.get('/youtube/auth/refresh', handleRefreshAccessToken)

// youtube videos
router.get('/youtube/videos', handleGetYoutubeVideos)

// notion database
router.get('/notion/videos', handleGetNotionVideos)

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

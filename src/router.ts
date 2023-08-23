import { NextFunction, Request, Response, Router } from 'express'
import {
  handleGetOAuthTokens,
  handleOAuthURL,
  handleRefreshAccessToken,
} from './handlers/googleOAuthHandler'
import { handleGetVideos } from './handlers/youtubeVideosHandler'
import axios from 'axios'
import { parse } from 'cookie'
import { handleGetDbEntries } from './handlers/notionDatabaseHandler'

const router = Router()

// cookies validation
router.use(
  '/youtube/videos',
  (req: Request, res: Response, next: NextFunction) => {
    const cookieHeader = req.headers.cookie

    if (!cookieHeader || typeof cookieHeader !== 'string') {
      console.log('Cookie header is missing or not a string.')
      res.redirect('/api/youtube/auth')
      return
    }

    const parsedCookies = parse(cookieHeader)
    const { access_token, refresh_token } = parsedCookies

    if (!access_token || typeof access_token !== 'string') {
      console.log('Access token is missing or not a string.')
      res.redirect('/api/youtube/auth/refresh')
      return
    }

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
// ! you can have more than one handler. You can even define them in an array. Make sure to call next() at the end of every handler
router.get('/youtube/videos', handleGetVideos)

// notion database
router.get('/notion/videos', handleGetDbEntries)

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

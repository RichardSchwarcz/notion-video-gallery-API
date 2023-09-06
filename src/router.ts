import { NextFunction, Request, Response, Router } from 'express'
import {
  handleGetOAuthTokens,
  handleOAuthURL,
  handleRefreshAccessToken,
} from './handlers/googleOAuthHandler'
import { handleGetYoutubeVideos } from './handlers/youtubeVideosHandler'
import { parse } from 'cookie'
import {
  handleGetNotionVideos,
  handleInitialLoad,
} from './handlers/notionDatabaseHandler'
import { InvalidPage, sync } from './handlers/sync'
import { getNotionDatabaseItems } from './getNotionVideos'

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
        'Access token is missing or not a string. Checking for refresh token'
      )
      // check refresh token
      if (!refresh_token || typeof refresh_token !== 'string') {
        console.log(
          'Refresh token is missing or not a string. Redirecting to auth from middleware'
        )
        res.redirect('/api/youtube/auth')
        return
      } else {
        res.redirect('/api/youtube/auth/refresh')
      }
      return
    }

    next()
  }
)

router.use('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const database_id = process.env.NOTION_DATABASE_ID as string
    const notionMainData = await getNotionDatabaseItems(database_id)

    const invalidPages: InvalidPage[] = []
    notionMainData.results.map((page: any) => {
      if (!page.properties.URL.url) {
        const pageTitle = page.properties.Name.title[0].plain_text
        const pageURL = page.url
        const pageID = page.id

        invalidPages.push({
          pageTitle,
          pageURL,
          pageID,
        })
      }
    })

    if (invalidPages.length > 0) {
      req.invalidPages = invalidPages
    }

    next()
  } catch (error) {
    next(error)
  }
})

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
router.get('/notion/load', handleInitialLoad)

// sync
router.get('/sync', sync)

// error
router.get('/error/unauthorized', (req: Request, res: Response) => {
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

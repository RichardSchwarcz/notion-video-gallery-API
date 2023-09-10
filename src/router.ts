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
import { sync } from './handlers/sync'
import { getNotionDatabaseItems } from './getNotionVideos'

const router = Router()

// cookies validation
router.use(
  ['/youtube/videos', '/notion', '/sync'],
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

type InvalidPage = {
  pageTitle: string
  pageURL: string
  pageID: string
}

type InvalidPages = {
  invalidPagesInMain: InvalidPage[]
  invalidPagesInSnapshot: InvalidPage[]
}

const getInvalidPages = async () => {
  try {
    const database_id = process.env.NOTION_DATABASE_ID as string
    const notionMainData = await getNotionDatabaseItems(database_id)

    const snapshot_id = process.env.NOTION_SNAPSHOT_ID as string
    const notionSnapshotData = await getNotionDatabaseItems(snapshot_id)

    const invalidPages: InvalidPages = {
      invalidPagesInMain: [],
      invalidPagesInSnapshot: [],
    }

    // random page in main DB without valid URL
    notionMainData.results.map((page: any) => {
      if (!page.properties.URL.url) {
        const pageTitle = page.properties.Name.title[0].plain_text as string
        const pageURL = page.url as string
        const pageID = page.id as string

        invalidPages.invalidPagesInMain.push({
          pageTitle,
          pageURL,
          pageID,
        })
      }
    })

    // random page in snapshot DB without valid URL
    notionSnapshotData.results.map((page: any) => {
      if (
        !page.properties.URL.url ||
        !page.properties.PlaylistItemID.rich_text[0].text.content
      ) {
        const pageTitle = page.properties.Name.title[0].plain_text as string
        const pageURL = page.url as string
        const pageID = page.id as string

        invalidPages.invalidPagesInSnapshot.push({
          pageTitle,
          pageURL,
          pageID,
        })
      }
    })

    return invalidPages
  } catch (error) {
    console.log(error)
  }
}

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

router.get('/sync', async (req, res) => {
  const invalidPages = await getInvalidPages()
  if (invalidPages) {
    const { invalidPagesInMain, invalidPagesInSnapshot } = invalidPages
    if (invalidPagesInMain.length > 0 || invalidPagesInSnapshot.length > 0) {
      res.redirect('/api/sync/invalid-pages')
    } else {
      return sync(req, res)
    }
  }
})

router.get('/sync/invalid-pages', async (req, res) => {
  const pages = await getInvalidPages()

  res.json({ pages })
})

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

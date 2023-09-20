import { NextFunction, Request, Response, Router } from 'express'
import {
  handleGetOAuthTokens,
  handleGetOAuthURL,
  handleRefreshAccessToken,
} from './handlers/googleOAuthHandler'
import { handleGetYoutubeVideos } from './handlers/youtubeVideosHandler'
import { parse } from 'cookie'
import {
  handleGetNotionVideos,
  handleInitialLoad,
} from './handlers/notionDatabaseHandler'
import { sync } from './handlers/sync'
import { getNotionData } from './utils/notionHelpers'
import cors from 'cors'

const router = Router()

const allowedOrigins = [
  'http://localhost:3000',
  'https://notion-video-gallery-client.vercel.app',
  'https://notion-video-gallery.onrender.com',
]

const corsOptions = {
  origin: (origin: any, callback: any) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}

router.use(cors(corsOptions))

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

const getInvalidPages = async (mainData: any, snapshotData: any) => {
  try {
    const invalidPages: InvalidPages = {
      invalidPagesInMain: [],
      invalidPagesInSnapshot: [],
    }

    // random page in main DB without valid URL
    mainData.results.map((page: any) => {
      const invalidPageProperties = {
        pageTitle: '',
        pageURL: '',
        pageID: '',
      }

      if (!page.properties.URL.url) {
        invalidPageProperties.pageURL = page.url as string
        invalidPageProperties.pageID = page.id as string
        const pageTitle = page.properties.Name.title[0]

        if (pageTitle) {
          Object.assign(invalidPageProperties, {
            pageTitle: pageTitle.plain_text,
          })
        }
        invalidPages.invalidPagesInMain.push(invalidPageProperties)
      }
    })

    // random page in snapshot DB without valid URL
    snapshotData.results.map((page: any) => {
      const invalidPageProperties = {
        pageTitle: '',
        pageURL: '',
        pageID: '',
      }
      if (
        !page.properties.URL.url ||
        !page.properties.PlaylistItemID.rich_text[0].text.content
      ) {
        invalidPageProperties.pageURL = page.url as string
        invalidPageProperties.pageID = page.id as string
        const pageTitle = page.properties.Name.title[0]

        if (pageTitle) {
          Object.assign(invalidPageProperties, {
            pageTitle: pageTitle.plain_text,
          })
        }
        invalidPages.invalidPagesInSnapshot.push(invalidPageProperties)
      }
    })

    return invalidPages
  } catch (error) {
    console.log(error)
  }
}

// auth
router.get('/youtube/auth', handleGetOAuthURL)

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
  const { mainData, snapshotData } = await getNotionData()
  const invalidPages = await getInvalidPages(mainData, snapshotData)
  if (invalidPages) {
    const { invalidPagesInMain, invalidPagesInSnapshot } = invalidPages
    if (invalidPagesInMain.length > 0 || invalidPagesInSnapshot.length > 0) {
      res.redirect('/api/sync/invalid-pages')
    } else {
      return sync(req, res, mainData, snapshotData)
    }
  }
})

router.get('/sync/invalid-pages', async (req, res) => {
  const { mainData, snapshotData } = await getNotionData()
  const pages = await getInvalidPages(mainData, snapshotData)

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

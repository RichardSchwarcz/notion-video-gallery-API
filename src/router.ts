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
    const testVideo = {
      title:
        'T3 Stack Tutorial - FROM 0 TO PROD FOR $0 (Next.js, tRPC, TypeScript, Tailwind, Prisma & More)',
      description:
        "I've never worked this hard on a video before. I really hope y'all can benefit from this 🙏\n\nGITHUB REPO https://github.com/t3dotgg/chirp\nDEPLOYED APP https://xn--uo8h.t3.gg/\nGET A JACKET IF YOU'RE COOL LIKE THAT https://shop.t3.gg/\n\nALL MY VIDEOS ARE POSTED EARLY ON PATREON https://www.patreon.com/t3dotgg\nEverything else (Twitch, Twitter, Discord & my blog): https://t3.gg/links\n\nTHANK YOU TO THE T3 DEPLOY PARTNERS\n- Clerk https://clerk.com/?utm_campaign=theo-dtc\n- Planetscale https://planetscale.com/?ref=theo\n- Upstash https://upstash.com/?utm_source=theo_qstash\n- Vercel https://vercel.com/?ref=theo\n- Axiom https://www.axiom.co/?ref=theo\n\n\nTHANK YOU @zombiefacesupreme FOR THE TIMESTAMPS\n[0:00] Introduction & Install\n[3:45] Setting up Github, Vercel, & Planetscale\n[11:30] Setting up Clerk, CAT BREAK, & Axiom\n[21:15] From Prisma Schema to tRPC Procedure\n[30:30] Style skeleton\n[37:15] Creating posts & connecting them to users\n[48:15] The PostView component\n[59:30] Relative time with dayjs\n[1:04:00] Next/Image\n[1:08:00] Loading spinner & handling loading states\n[1:19:15] tRPC Context, auth state, and private procedures\n[1:27:00] Zod, useMutation, sorting the feed, and onSuccess\n[1:38:00] Rate limiting with Upstash\n[1:43:45] Error handling with Zod & react-hot-toast\n[1:52:30] Routing -- Profile View & Post View\n[1:57:30] Creating profileRouter \n[2:06:00] Using tRPC's createProxySSGHelpers\n[2:14:45] The Layout\n[2:19:15] The Profile Page\n[2:28:00] The Profile Feed\n[2:38:45] The Post Page\n[2:47:15] Github CI\n[2:52:45] Domain Name Redirect\n[2:55:15] Conclusion",
      thumbnail: 'https://i.ytimg.com/vi/YkOSUVzOAA4/hqdefault.jpg',
      videoOwnerChannelTitle: 'Theo - t3․gg',
    }
    const post = await postToNotionDatabase(testVideo)
    console.log(post)
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

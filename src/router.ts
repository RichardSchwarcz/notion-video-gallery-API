import { NextFunction, Request, Response, Router } from 'express'
import {
  handleGetOAuthTokens,
  handleOAuthURL,
  handleRefreshAccessToken,
} from './handlers/googleOAuthHandler'
import { handleGetVideos } from './handlers/youtubeVideosHandler'
import axios from 'axios'
import { parse } from 'cookie'

const router = Router()

// router.use(
//   '/youtube/videos',
//   (req: Request, res: Response, next: NextFunction) => {
//     const cookieHeader = req.headers.cookie
//     // console.log(cookieHeader)
//     if (!cookieHeader || typeof cookieHeader !== 'string') {
//       console.log('Cookie header is missing or not a string.')
//       res.redirect('/api/youtube/auth')
//       return
//     }

//     const parsedCookies = parse(cookieHeader)
//     const { access, refresh } = parsedCookies

//     if (!access || typeof access !== 'string') {
//       console.log('Access token is missing or not a string.')
//       res.redirect('/api/youtube/auth')
//       return
//     }

//     if (!refresh || typeof refresh !== 'string') {
//       console.log('Refresh token is missing or not a string.')
//       res.redirect('/api/youtube/auth')
//       return
//     }

//     next()
//   }
// )

// auth
router.get('/youtube/auth', handleOAuthURL)

router.get('/youtube/auth/redirect', handleGetOAuthTokens)

// TODO handle refreshing access token in videos
router.get('/youtube/auth/refresh', handleRefreshAccessToken)

// youtube videos
// ! you can have more than one handler. You can even define them in an array. Make sure to call next() at the end of every handler
router.get('/youtube/videos', handleGetVideos)

// notion database
router.get('/notion/videos', async (res: Response) => {
  const url = `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`

  const options = {
    headers: {
      Authorization: `Bearer ${process.env.NOTION_SECRET}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  }

  try {
    const response = await axios.post(url, { page_size: 100 }, options)
    const data = await response.data

    res.json({
      items: data,
    })
  } catch (error: any) {
    console.log(error, 'Failed to fetch notion database items')
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

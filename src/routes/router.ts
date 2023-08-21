import { Request, Response, Router } from 'express'
import { getGoogleOAuthURL } from '../googleOAuthURL'
import {
  getTokensAndRedirect,
  refreshAccessToken,
} from '../handlers/googleOAuth'
import { getVideos } from '../handlers/videos'

const router = Router()

// auth
router.get('/loginURL', (req: Request, res: Response) => {
  res.json({
    generated: getGoogleOAuthURL(),
  })
})

router.get('/auth/google/redirect', getTokensAndRedirect)

router.get('/auth/refresh', refreshAccessToken)

// videos
router.get('/videos', getVideos)

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

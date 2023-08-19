import { Request, Response } from 'express'
import router from './router'
import { getGoogleOAuthURL } from '../googleOAuthURL'
import { getGoogleOAuthTokens } from '../getGoogleTokens'

router.get('/auth', (req: Request, res: Response) => {
  res.json({
    generated: getGoogleOAuthURL(),
  })
})

router.get('/auth/google/redirect', async (req: Request, res: Response) => {
  // get code from URL
  const code = req.query.code as string

  try {
    const tokens = await getGoogleOAuthTokens(code)

    res.cookie('access', tokens.access_token, {
      httpOnly: true,
    })

    res.cookie('refresh', tokens.refresh_token, {
      httpOnly: true,
    })

    res.json({
      code: code,
      tokens: tokens,
    })

    // res.redirect('/api/videos')
  } catch (error: any) {
    console.log(error.message)
    res.redirect('/api/auth')
  }
})

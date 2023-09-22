import { Request, Response } from 'express'
import {
  getGoogleOAuthTokens,
  refreshGoogleOAuthAccessToken,
} from '../getGoogleTokens'
import { parse, serialize } from 'cookie'
import { getGoogleOAuthURL } from '../googleOAuthURL'

export async function handleGetOAuthURL(req: Request, res: Response) {
  res.json({
    googleOAuthURL: getGoogleOAuthURL(),
  })
}

export async function handleGetOAuthTokens(req: Request, res: Response) {
  // get code from URL
  const code = req.query.code as string

  try {
    const tokens = await getGoogleOAuthTokens(code)

    const accessTokenCookie = serialize('access_token', tokens.access_token, {
      httpOnly: true,
      maxAge: tokens.expires_in - 200,
      path: '/api',
      secure: true,
    })

    const refreshTokenCookie = serialize(
      'refresh_token',
      tokens.refresh_token,
      {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: '/api',
        secure: true,
      }
    )

    res.setHeader('Set-Cookie', [accessTokenCookie, refreshTokenCookie])

    res.json({
      code: code,
      tokens: tokens,
    })
    // res.redirect('http://localhost:3000/video-gallery')
  } catch (error: any) {
    console.log(error.message)
    res.redirect('/api/youtube/auth')
  }
}

export async function handleRefreshAccessToken(req: Request, res: Response) {
  const cookieHeader = req.headers.cookie

  if (!cookieHeader || typeof cookieHeader !== 'string') {
    console.log('Cookie header is missing or not a string.')
    return
  }

  const parsedCookies = parse(cookieHeader)

  try {
    const response = await refreshGoogleOAuthAccessToken(
      parsedCookies.refresh_token
    )

    const accessTokenCookie = serialize('access_token', response.access_token, {
      httpOnly: true,
      maxAge: response.expires_in - 200,
      path: '/api',
    })

    res.setHeader('Set-Cookie', accessTokenCookie)

    res.json({
      response: response,
    })
  } catch (error: any) {
    console.log(error.message)
  }
}

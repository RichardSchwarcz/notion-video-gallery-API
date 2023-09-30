import 'dotenv/config'

import { Request, Response } from 'express'
import {
  getGoogleOAuthTokens,
  refreshGoogleOAuthAccessToken,
} from '../getGoogleTokens'
import { parse, serialize } from 'cookie'
import { getGoogleOAuthURL } from '../googleOAuthURL'
import { URLs } from '../utils/url'

export async function handleGetOAuthURL(req: Request, res: Response) {
  res.json({
    googleOAuthURL: getGoogleOAuthURL(),
  })
}

export async function handleGetOAuthTokens(req: Request, res: Response) {
  // get code from URL
  const code = req.query.code as string

  const cookieHeader = req.headers.cookie
  console.log(cookieHeader, 'TOTPO')

  try {
    const tokens = await getGoogleOAuthTokens(code)
    console.log(tokens)

    // const isProduction = process.env.NODE_ENV === 'production'
    // const CLIENT_URL = isProduction ? URLs.client.prod : URLs.client.dev

    res
      .cookie('access_token', tokens.access_token, {
        httpOnly: true,
        maxAge: tokens.expires_in - 200,
        path: '/api',
        secure: true,
      })
      .cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: '/api',
        secure: true,
      })
      // .status(200)
      .send('hi')
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

    const isProduction = process.env.NODE_ENV === 'production'
    const CLIENT_URL = isProduction ? URLs.client.prod : URLs.client.dev

    res
      .cookie('access_token', response.access_token, {
        httpOnly: true,
        path: '/api',
        secure: true,
      })
      .json({
        message: 'x',
      })
  } catch (error: any) {
    console.log(error.message)
  }
}

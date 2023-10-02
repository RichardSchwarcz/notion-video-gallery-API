import 'dotenv/config'

import { Request, Response } from 'express'
import {
  getGoogleOAuthTokens,
  refreshGoogleOAuthAccessToken,
} from '../getGoogleTokens'
import { parse } from 'cookie'
import { URLs } from '../utils/url'

export async function handleGetOAuthURL(_req: Request, res: Response) {
  const scopes = ['https://www.googleapis.com/auth/youtube']
  const rootURL = 'https://accounts.google.com/o/oauth2/v2/auth'

  const options = {
    redirect_uri: process.env.GOOGLE_REDIRECT_URL as string,
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: scopes.join(' '),
  }

  const qs = new URLSearchParams(options)

  const OAuthURL = `${rootURL}?${qs.toString()}`

  res.json({
    googleOAuthURL: OAuthURL,
  })
}

export async function handleGetOAuthTokens(req: Request, res: Response) {
  // get code from URL
  const code = req.query.code as string

  try {
    const tokens = await getGoogleOAuthTokens(code)
    console.log(tokens)
    console.log(res.getHeaders(), 'first')
    console.log(req.headers)

    res
      .cookie('access_token', tokens.access_token, {
        httpOnly: true,
        path: '/api',
        secure: true,
      })
      .cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: '/api',
        secure: true,
      })
    res.send('hi')
    // .redirect(process.env.CLIENT_URL as string)
    console.log(res.getHeaders(), 'second')
  } catch (error: any) {
    console.log(error.message)
    res.redirect('/api/auth')
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

import axios from 'axios'
import qs from 'qs'

interface OAuthTokens {
  // depends on scopes
  access_token: string
  expires_in: number
  refresh_token: string
  scope: string
  token_type: string
}

interface refreshedAccessToken extends Omit<OAuthTokens, 'refresh_token'> {}

export async function getGoogleOAuthTokens(code: string): Promise<OAuthTokens> {
  const url = 'https://oauth2.googleapis.com/token'

  const values = {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
    redirect_uri: process.env.GOOGLE_REDIRECT_URL as string,
    grant_type: 'authorization_code',
  }

  try {
    const response = await axios.post<OAuthTokens>(url, qs.stringify(values), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    return response.data
  } catch (error: any) {
    console.error(error, 'Failed to fetch Google Oauth Tokens')
    throw new Error(error.message)
  }
}

export async function refreshGoogleOAuthAccessToken(
  refreshToken: string
): Promise<refreshedAccessToken> {
  const url = 'https://oauth2.googleapis.com/token'

  const values = {
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  }

  try {
    const response = await axios.post<refreshedAccessToken>(url, null, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      params: values,
    })
    return response.data
  } catch (error: any) {
    console.error(error, 'Failed to refresh access token')
    throw new Error(error.message)
  }
}

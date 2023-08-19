import axios from 'axios'
import qs from 'qs'

interface GoogleTokens {
  // depends on scopes
  access_token: string
  expires_in: Number
  refresh_token: string
  scope: string
  token_type: string
}

export async function getGoogleOAuthTokens(
  code: string
): Promise<GoogleTokens> {
  const url = 'https://oauth2.googleapis.com/token'

  const values = {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
    redirect_uri: process.env.GOOGLE_REDIRECT_URL as string,
    grant_type: 'authorization_code',
  }

  try {
    const response = await axios.post<GoogleTokens>(url, qs.stringify(values), {
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

export async function refreshGoogleOAuthAccessToken(refreshToken: string) {
  const url = 'https://oauth2.googleapis.com/token'

  const values = {
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  }

  try {
    const response = await axios.post(url, null, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      params: values,
    })
    return response.data
  } catch (error: any) {
    console.error(error, 'Failed to refresh access token')
    // throw new Error(error.message)
  }
}

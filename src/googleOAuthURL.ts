import 'dotenv/config'

const scopes = ['https://www.googleapis.com/auth/youtube']

export function getGoogleOAuthURL() {
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

  return `${rootURL}?${qs.toString()}`
}

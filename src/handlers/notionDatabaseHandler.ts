import axios from 'axios'
import { parse } from 'cookie'
import { Request, Response } from 'express'
import { fetchYoutubeVideosRecursively } from '../fetchYoutubeVideos'
import { postDelayedRequests } from '../utils/postDelayedRequests'
import { postToNotionDatabase } from '../postNotionEntries'

export async function handleGetNotionVideos(req: Request, res: Response) {
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
      entries: data,
    })
  } catch (error: any) {
    console.log(error, 'Failed to fetch notion database items')
  }
}

export async function handleInitialLoad(req: Request, res: Response) {
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
    console.log('Starting API requests...')
    try {
      const post = await postDelayedRequests(videos, postToNotionDatabase, 350)
      console.log('API requests completed:', post)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      console.log('All operations completed.')
    }
  } catch (error: any) {
    const errorMessage = `${error.response.status} ${error.response.statusText}`

    if (errorMessage == '401 Unauthorized') {
      res.redirect('/api/error/unauthorized')
    }
  }
}

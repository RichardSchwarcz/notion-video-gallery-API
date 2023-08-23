import axios from 'axios'
import { Request, Response } from 'express'

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

import { Client } from '@notionhq/client'
import {
  PageObjectResponse,
  QueryDatabaseParameters,
} from '@notionhq/client/build/src/api-endpoints'

const notion = new Client({ auth: process.env.NOTION_SECRET })

// ------------- FUNCTIONS ----------------

export async function getNotionDatabaseItems(database_id: string) {
  const params: QueryDatabaseParameters = {
    database_id: database_id,
  }
  const res = await notion.databases.query(params)
  const URLs = res.results.map((video: any) => {
    return video.properties.URL.url
  })
  const IDs = URLs.map((url) => {
    const regex = /(?:v=|\/)([a-zA-Z0-9_-]{11})/
    const match = url.match(regex)
    if (match) {
      return match[1]
    }
  })
  return IDs
}

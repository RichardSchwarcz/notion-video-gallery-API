import { Client } from '@notionhq/client'
import {
  CreatePageParameters,
  CreatePageResponse,
} from '@notionhq/client/build/src/api-endpoints'

const notion = new Client({ auth: process.env.NOTION_SECRET })

export interface videoSchema {
  title: string
  thumbnail: string
  url: string
  videoOwnerChannelTitle: string
  duration: string
}

export async function postToNotionDatabase(
  video: videoSchema
): Promise<CreatePageResponse> {
  const parameters: CreatePageParameters = {
    parent: {
      type: 'database_id',
      database_id: process.env.NOTION_DATABASE_ID as string,
    },
    cover: {
      external: { url: `${video.thumbnail}` },
    },
    properties: {
      Name: {
        title: [{ text: { content: `${video.title}` as string } }],
      },
      Author: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: `${video.videoOwnerChannelTitle}`,
            },
          },
        ],
      },
      URL: {
        url: `${video.url}`,
      },
      Duration: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: `${video.duration}`,
            },
          },
        ],
      },
    },
  }
  return await notion.pages.create(parameters)
}

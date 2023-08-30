import { Client } from '@notionhq/client'
import {
  CreatePageParameters,
  CreatePageResponse,
} from '@notionhq/client/build/src/api-endpoints'
import { VideoSchema } from './types/videoTypes'

const notion = new Client({ auth: process.env.NOTION_SECRET })

// ------------- FUNCTIONS ----------------

export async function postToNotionDatabase(
  video: VideoSchema
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
export async function postToNotionSnapshot(video: {
  title: string
  url: string
}): Promise<CreatePageResponse> {
  const parameters: CreatePageParameters = {
    parent: {
      type: 'database_id',
      database_id: process.env.NOTION_SNAPSHOT_ID as string,
    },
    properties: {
      Name: {
        title: [{ text: { content: `${video.title}` as string } }],
      },
      URL: {
        url: `${video.url}`,
      },
    },
  }
  return await notion.pages.create(parameters)
}

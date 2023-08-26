import { Client } from '@notionhq/client'
import { CreatePageParameters } from '@notionhq/client/build/src/api-endpoints'

const notion = new Client({ auth: process.env.NOTION_SECRET })

interface videoSchema {
  title: string
  description: string
  thumbnail: string
  videoOwnerChannelTitle: string
}

export async function postToNotionDatabase(video: videoSchema) {
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
    },
    children: [
      {
        callout: {
          rich_text: [{ text: { content: `${video.description}` } }],
          color: 'blue',
        },
      },
    ],
  }
  await notion.pages.create(parameters)
}

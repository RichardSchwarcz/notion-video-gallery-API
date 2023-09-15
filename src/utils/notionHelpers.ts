import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_SECRET })

export async function getNotionData() {
  const databaseId = process.env.NOTION_DATABASE_ID as string
  const mainData = await notion.databases.query({ database_id: databaseId })

  const snapshot_id = process.env.NOTION_SNAPSHOT_ID as string
  const snapshotData = await notion.databases.query({
    database_id: snapshot_id,
  })

  return {
    mainData,
    snapshotData,
  }
}

export const getNotionIDs = (mainData: any, snapshotData: any) => {
  const notionMainDataIDs: NotionDataIDs[] = getNotionDataIDs(mainData)
  const notionMainVideosIDs = notionMainDataIDs.map(
    (video) => video.youtubeVideoID
  )
  const notionSnapshotDataIDs: NotionDataIDs[] = getNotionDataIDs(snapshotData)
  const notionSnapshotVideosIDs = notionSnapshotDataIDs.map(
    (video) => video.youtubeVideoID
  )

  return {
    notionMainDataIDs,
    notionMainVideosIDs,
    notionSnapshotDataIDs,
    notionSnapshotVideosIDs,
  }
}

function getNotionDataIDs(notionData: any): NotionDataIDs[] {
  return notionData.results.map((video: any) => {
    const notionPageID = video.id
    const url = video.properties.URL.url
    const regex = /(?:v=|\/)([a-zA-Z0-9_-]{11})/
    const match = url.match(regex)
    const youtubeVideoID = match[1]
    return { notionPageID, youtubeVideoID }
  })
}

export type NotionDataIDs = {
  notionPageID: string
  youtubeVideoID?: string
}

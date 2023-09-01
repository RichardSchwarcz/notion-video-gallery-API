import { Request, Response } from 'express'
import { getNotionDatabaseItems } from '../getNotionVideos'
import { compareArrays } from '../utils/compareArrays'
import {
  PageObjectResponse,
  QueryDatabaseResponse,
} from '@notionhq/client/build/src/api-endpoints'
import { getNotionDataIDs } from '../utils/notionHelpers'
import { SnapshotData } from '../types/notionTypes'
import { getYoutubeVideoIDfromURL } from '../utils/youtubeHelpers'

export async function sync(req: Request, res: Response) {
  // get notion videos (Ids)
  const database_id = process.env.NOTION_DATABASE_ID as string
  const notionMainData = await getNotionDatabaseItems(database_id)
  const notionMainDataIDs = getNotionDataIDs(notionMainData)

  // get notion snapshot (Ids)
  const snapshot_id = process.env.NOTION_SNAPSHOT_ID as string
  const notionSnapshotData = await getNotionDatabaseItems(snapshot_id)
  const notionSnapshotDataIDs = getNotionDataIDs(notionSnapshotData)

  // compare videos and snapshot = see which videos have been deleted
  const difference: string[] = compareArrays(
    notionMainDataIDs,
    notionSnapshotDataIDs
  )

  // get video ID as playlist item - each video in playlist has its own unique ID for that playlist
  const getPlaylistItemsIDs = (
    difference: string[],
    notionSnapshotData: any
  ) => {
    if (difference.length > 0) {
      const toDelete = notionSnapshotData.results.filter((video: any) => {
        const URL = video.properties.URL.url
        const ID = getYoutubeVideoIDfromURL(URL)
        if (ID) {
          return difference.includes(ID)
        }
        return
      })

      const playlistItemsIDs = toDelete.map((video: any) => {
        return video.properties.PlaylistItemID.rich_text[0].text.content
      })
      return playlistItemsIDs
    }
  }

  // post to youtube playlist (remove deleted videos from notion)
  //.....
  // get all youtube videos (video objects)
  //....
  // compare with notion DB = see which videos are new
  //....
  // post to notion DB (video objects)
  //....
  // post to notion snapshot

  res.json({
    deletedVideos: difference,
    toDelete: getPlaylistItemsIDs(difference, notionSnapshotData),
    main: notionMainDataIDs,
    snapshot: notionSnapshotData,
  })
}

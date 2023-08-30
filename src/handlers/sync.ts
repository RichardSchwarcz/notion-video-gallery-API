import { Request, Response } from 'express'
import { getNotionDatabaseItems } from '../getNotionVideos'
import { compareArrays } from '../utils/compareArrays'

export async function sync(req: Request, res: Response) {
  // get notion videos (Ids)
  const database_id = process.env.NOTION_DATABASE_ID as string
  const notionVideosIDs = await getNotionDatabaseItems(database_id)
  // get notion snapshot (Ids)
  const snapshot_id = process.env.NOTION_SNAPSHOT_ID as string
  const notionSnapshotIds = await getNotionDatabaseItems(snapshot_id)
  // compare videos and snapshot = see which videos have been deleted
  const difference = compareArrays(notionVideosIDs, notionSnapshotIds)
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
    difference: difference,
    main: notionVideosIDs,
    snapshot: notionSnapshotIds,
  })
}

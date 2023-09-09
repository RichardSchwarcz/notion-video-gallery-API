import { NotionDataIDs } from './notionHelpers'
import { getYoutubeVideoIDfromURL } from './youtubeHelpers'

export function findPlaylistItemsIDsInSnapshotToDelete(
  difference: NotionDataIDs[],
  notionSnapshotData: any
): string[] {
  const videosIDs = difference.map((item) => item.youtubeVideoID)

  const snapshotDataToDelete = notionSnapshotData.results.filter(
    (video: any) => {
      const URL: string = video.properties.URL.url
      const ID = getYoutubeVideoIDfromURL(URL)
      return ID ? videosIDs.includes(ID) : null
    }
  )

  const playlistItemsIDs: string[] = snapshotDataToDelete.map((video: any) => {
    return video.properties.PlaylistItemID.rich_text[0].text.content
  })
  return playlistItemsIDs
}

export function findDeletedVideos(
  mainData: NotionDataIDs[],
  snapshotData: NotionDataIDs[]
) {
  const difference: DifferenceObject = {
    deletedFromMain: [],
    deletedFromSnapshot: [],
  }

  const mainDBvideosID = mainData.map((mainItem) => {
    return mainItem.youtubeVideoID
  })

  const snapshotDBvideosID = snapshotData.map((snapshotItem) => {
    return snapshotItem.youtubeVideoID
  })

  // video deleted from main DB but still in snapshot
  snapshotData.forEach((snapshotItem) => {
    if (!mainDBvideosID.includes(snapshotItem.youtubeVideoID)) {
      difference.deletedFromMain.push(snapshotItem)
    }
  })

  // video deleted from snapshot but still in main DB
  mainData.forEach((mainItem) => {
    if (!snapshotDBvideosID.includes(mainItem.youtubeVideoID)) {
      difference.deletedFromSnapshot.push(mainItem)
    }
  })

  return difference
}

export type DifferenceObject = {
  deletedFromMain: NotionDataIDs[]
  deletedFromSnapshot: NotionDataIDs[]
}

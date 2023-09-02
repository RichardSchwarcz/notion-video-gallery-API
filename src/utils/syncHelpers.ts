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
): NotionDataIDs[] {
  const difference: NotionDataIDs[] = []

  const mainDBvideosID = mainData.map((mainItem) => {
    return mainItem.youtubeVideoID
  })

  snapshotData.forEach((snapshotItem) => {
    if (!mainDBvideosID.includes(snapshotItem.youtubeVideoID)) {
      difference.push(snapshotItem)
    }
  })

  return difference
}

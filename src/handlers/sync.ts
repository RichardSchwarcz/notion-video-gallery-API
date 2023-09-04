import { Request, Response } from 'express'
import { getNotionDatabaseItems } from '../getNotionVideos'
import { NotionDataIDs, getNotionDataIDs } from '../utils/notionHelpers'
import {
  formatPlaylistItems,
  getVideosIds,
  getYoutubeVideosDuration,
} from '../utils/youtubeHelpers'
import {
  deleteYoutubePlaylistItem,
  getYoutubeVideosRecursively,
} from '../getYoutubeVideos'
import { parse } from 'cookie'
import {
  PlaylistItem,
  RawPlaylistItem,
  RawVideoData,
  VideoDuration,
  VideosOptions,
} from '../types/videoTypes'
import {
  archiveNotionPage,
  postToNotionDatabase,
  postToNotionSnapshot,
} from '../postToNotionDatabase'
import { postDelayedRequests } from '../utils/postDelayedRequests'
import { combineVideoArrays, formatSnapshotData } from './notionDatabaseHandler'
import {
  findDeletedVideos,
  findPlaylistItemsIDsInSnapshotToDelete,
} from '../utils/syncHelpers'

export async function sync(req: Request, res: Response) {
  const cookieHeader = req.headers.cookie

  if (!cookieHeader || typeof cookieHeader !== 'string') {
    console.log('Cookie header is missing or not a string.')
    return
  }

  const parsedCookies = parse(cookieHeader)
  const { access_token } = parsedCookies

  //* get videos from notion main DB (Ids)
  const database_id = process.env.NOTION_DATABASE_ID as string
  const notionMainData = await getNotionDatabaseItems(database_id)
  const notionMainDataIDs: NotionDataIDs[] = getNotionDataIDs(notionMainData)

  const notionMainVideosIDs = notionMainDataIDs.map(
    (video) => video.youtubeVideoID
  )

  //* get videos from notion snapshot DB (Ids)
  const snapshot_id = process.env.NOTION_SNAPSHOT_ID as string
  const notionSnapshotData = await getNotionDatabaseItems(snapshot_id)
  const notionSnapshotDataIDs: NotionDataIDs[] =
    getNotionDataIDs(notionSnapshotData)

  //* compare main and snapshot -> see which videos have been deleted from main
  const difference: NotionDataIDs[] = findDeletedVideos(
    notionMainDataIDs,
    notionSnapshotDataIDs
  )
  //! check what else makes difference
  /**
   * - random item added to main DB
   * - random item added to snapshot DB
   * - item deleted from snapshot DB but not from main DB
   * TODO write a function find difference which will return multiple types of differences
   **/
  // console.log('these are IDs of videos to be deleted:', difference)

  //* get youtube videos in case something has been added
  const videosOptions: VideosOptions = {
    part: 'snippet',
    maxResults: '50',
    playlistId: 'PLogYAbXxpcswCx7liCyjv05nGPggNiLOh',
  }
  const rawPlaylistItems: RawPlaylistItem[] = await getYoutubeVideosRecursively(
    access_token,
    'playlistItems',
    videosOptions
  )

  //* compare with main DB = see which videos are new
  const newRawPlaylistItems = rawPlaylistItems.filter(
    (video: RawPlaylistItem) => {
      return !notionMainVideosIDs.includes(video.snippet.resourceId.videoId)
    }
  )
  const newFormattedVideos: PlaylistItem[] | [] =
    formatPlaylistItems(newRawPlaylistItems)
  // console.log('these are all formatted videos: ', formattedVideos)

  //* get durations for new videos
  const videosDataOptions: VideosOptions = {
    part: 'contentDetails',
    maxResults: '50',
    id: getVideosIds(newFormattedVideos),
  }
  const rawVideosData: RawVideoData[] = await getYoutubeVideosRecursively(
    access_token,
    'videos',
    videosDataOptions
  )
  const durations: VideoDuration[] = getYoutubeVideosDuration(rawVideosData)

  //! if difference is caused by deleting video from main DB (validate)
  if (difference.length && newFormattedVideos.length > 0) {
    //* get video ID as playlist item from snapshot data
    // each video in youtube playlist has its own unique ID for that playlist
    const playlistItemsIDsToDelete = findPlaylistItemsIDsInSnapshotToDelete(
      difference,
      notionSnapshotData
    )

    //* delete request to youtube playlist (remove videos deleted in notion)
    for (const item of playlistItemsIDsToDelete) {
      const qs = new URLSearchParams({ id: item })
      const res = await deleteYoutubePlaylistItem(access_token, qs)

      if (res.status !== 204) {
        break
      }
    }

    //* post to notion snapshot DB (remove difference)
    const notionPagesIDs = difference.map((page) => page.notionPageID)
    await postDelayedRequests(notionPagesIDs, archiveNotionPage, 350)
    // console.log('IDs of notion pages to be deleted:', notionPagesIDs)

    //* post to notion main DB (new video objects)
    const newDataToMainDB = combineVideoArrays(newFormattedVideos, durations)
    await postDelayedRequests(newDataToMainDB, postToNotionDatabase, 350)
    // console.log('these are new videos to be added to notion: ', newDataToMainDB)

    //* post to notion snapshot DB (new video objects)
    const newDataToSnapshotDB = formatSnapshotData(newRawPlaylistItems)
    await postDelayedRequests(newDataToSnapshotDB, postToNotionSnapshot, 350)
  }

  res.json({
    deletedVideos: difference,
    mainIds: notionMainDataIDs,
    snapshot: notionSnapshotDataIDs,
  })
}

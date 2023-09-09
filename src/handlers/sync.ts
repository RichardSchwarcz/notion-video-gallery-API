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
  VideoSchema,
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
  DifferenceObject,
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

  //* get videos from notion main DB
  const database_id = process.env.NOTION_DATABASE_ID as string
  const notionMainData = await getNotionDatabaseItems(database_id)
  const notionMainDataIDs: NotionDataIDs[] = getNotionDataIDs(notionMainData)

  const notionMainVideosIDs = notionMainDataIDs.map(
    (video) => video.youtubeVideoID
  )

  //* get videos from notion snapshot DB
  const snapshot_id = process.env.NOTION_SNAPSHOT_ID as string
  const notionSnapshotData = await getNotionDatabaseItems(snapshot_id)
  const notionSnapshotDataIDs: NotionDataIDs[] =
    getNotionDataIDs(notionSnapshotData)

  //* compare main and snapshot -> see which videos have been deleted from main
  const difference: DifferenceObject = findDeletedVideos(
    notionMainDataIDs,
    notionSnapshotDataIDs
  )

  //! check item deleted from snapshot DB but not from main DB
  //! handle duplicate videos

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
  console.log('these are all new formatted videos: ', newFormattedVideos)

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

  if (difference.deletedFromMain.length > 0) {
    //* get video ID as playlist item from snapshot data
    // each video in youtube playlist has its own unique ID for that playlist
    const playlistItemsIDsToDelete = findPlaylistItemsIDsInSnapshotToDelete(
      difference.deletedFromMain,
      notionSnapshotData
    )

    //* delete request to youtube playlist (remove videos deleted in notion)
    console.log('deleting from youtube')
    for (const item of playlistItemsIDsToDelete) {
      const qs = new URLSearchParams({ id: item })
      const res = await deleteYoutubePlaylistItem(access_token, qs)

      if (res.status !== 204) {
        break
      }
    }

    //* post to notion snapshot DB (remove difference)
    console.log('removing difference deleting from snapshot')
    const notionPagesIDs = difference.deletedFromMain.map(
      (page) => page.notionPageID
    )
    await postDelayedRequests(notionPagesIDs, archiveNotionPage, 350)
    // console.log('IDs of notion pages to be deleted:', notionPagesIDs)

    let message: {
      message: string
      videos: NotionDataIDs[]
      newVideos?: VideoSchema[]
    } = {
      message: 'deleted following videos from youtube playlist',
      videos: difference.deletedFromMain,
      newVideos: [],
    }

    if (newFormattedVideos.length > 0) {
      //* post to notion main DB (new video objects)
      console.log('posting new video to main', newFormattedVideos)
      const newDataToMainDB = combineVideoArrays(newFormattedVideos, durations)
      await postDelayedRequests(newDataToMainDB, postToNotionDatabase, 350)
      // console.log('these are new videos to be added to notion: ', newDataToMainDB)

      //* post to notion snapshot DB (new video objects)
      console.log('posting new video to snapshot')
      const newDataToSnapshotDB = formatSnapshotData(newRawPlaylistItems)
      await postDelayedRequests(newDataToSnapshotDB, postToNotionSnapshot, 350)

      message.newVideos = newDataToMainDB
    }

    res.json(message)
  }

  if (difference.deletedFromMain.length == 0 && newFormattedVideos.length > 0) {
    //* post to notion main DB (new video objects)
    console.log('posting new video to main - only add case')
    const newDataToMainDB = combineVideoArrays(newFormattedVideos, durations)
    await postDelayedRequests(newDataToMainDB, postToNotionDatabase, 350)
    // console.log('these are new videos to be added to notion: ', newDataToMainDB)

    //* post to notion snapshot DB (new video objects)
    console.log('posting new video to snapshot - only add case')
    const newDataToSnapshotDB = formatSnapshotData(newRawPlaylistItems)
    await postDelayedRequests(newDataToSnapshotDB, postToNotionSnapshot, 350)

    res.json({
      message: 'new videos added',
      videos: newDataToMainDB,
    })
  }

  if (
    difference.deletedFromMain.length == 0 &&
    newFormattedVideos.length == 0
  ) {
    res.json({
      message: 'everything is in sync!',
    })
  }

  // res.json({
  //   deletedVideos: difference,
  //   mainIds: notionMainDataIDs,
  //   snapshot: notionSnapshotDataIDs,
  // })
}

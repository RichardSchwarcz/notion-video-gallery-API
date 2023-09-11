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
import { PLAYLIST_ID } from '../constants'

//! add response json object with message

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

  const notionSnapshotVideosIDs = notionSnapshotDataIDs.map(
    (video) => video.youtubeVideoID
  )

  //* compare main and snapshot -> see which videos have been deleted from main
  const difference: DifferenceObject = findDeletedVideos(
    notionMainDataIDs,
    notionSnapshotDataIDs
  )

  //! handle duplicate videos

  //* get youtube videos in case something has been added
  const videosOptions: VideosOptions = {
    part: 'snippet',
    maxResults: '50',
    playlistId: PLAYLIST_ID,
  }
  const rawPlaylistItems: RawPlaylistItem[] = await getYoutubeVideosRecursively(
    access_token,
    'playlistItems',
    videosOptions
  )

  //* compare with snapshot DB = see which videos are new
  const newRawPlaylistItems = rawPlaylistItems.filter(
    (video: RawPlaylistItem) => {
      return (
        !notionSnapshotVideosIDs.includes(video.snippet.resourceId.videoId) &&
        !notionMainVideosIDs.includes(video.snippet.resourceId.videoId)
      )
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

  const conditions = {
    deletedFromMain: difference.deletedFromMain.length > 0,
    deletedFromSnapshot: difference.deletedFromSnapshot.length > 0,
    newYoutubeVideos: newFormattedVideos.length > 0,
  }

  if (conditions.deletedFromMain && conditions.newYoutubeVideos) {
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

    //* post to notion main DB (new video objects)
    console.log('posting new video to main', newFormattedVideos)
    const newDataToMainDB = combineVideoArrays(newFormattedVideos, durations)
    await postDelayedRequests(newDataToMainDB, postToNotionDatabase, 350)

    //* post to notion snapshot DB (new video objects)
    console.log('posting new video to snapshot')
    const newDataToSnapshotDB = formatSnapshotData(newRawPlaylistItems)
    await postDelayedRequests(newDataToSnapshotDB, postToNotionSnapshot, 350)

    let message: {
      message_del: string
      videos: NotionDataIDs[]
      message_add: string
      newVideos: VideoSchema[]
    } = {
      message_del: 'deleted following videos from youtube playlist',
      videos: difference.deletedFromMain,
      message_add: 'added following videos',
      newVideos: newDataToMainDB,
    }

    res.json(message)
  }

  if (conditions.deletedFromMain && !conditions.newYoutubeVideos) {
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
  }

  if (
    !conditions.deletedFromMain &&
    !conditions.deletedFromSnapshot &&
    conditions.newYoutubeVideos
  ) {
    //* post to notion main DB (new video objects)
    console.log('posting new video to main - only add case')
    const newDataToMainDB = combineVideoArrays(newFormattedVideos, durations)
    await postDelayedRequests(newDataToMainDB, postToNotionDatabase, 350)

    //* post to notion snapshot DB (new video objects)
    console.log('posting new video to snapshot - only add case')
    const newDataToSnapshotDB = formatSnapshotData(newRawPlaylistItems)
    await postDelayedRequests(newDataToSnapshotDB, postToNotionSnapshot, 350)

    res.json({
      message: 'new videos added',
      videos: newDataToMainDB,
    })
  }

  const accidentallyDeletedFromSnapshot = rawPlaylistItems.filter(
    (video: RawPlaylistItem) => {
      return (
        !notionSnapshotVideosIDs.includes(video.snippet.resourceId.videoId) &&
        notionMainVideosIDs.includes(video.snippet.resourceId.videoId)
      )
    }
  )

  if (conditions.deletedFromSnapshot) {
    //* post to notion snapshot DB (new video objects)
    console.log(
      'posting new video to snapshot - only deleted from snapshot case'
    )
    const newDataToSnapshotDB = formatSnapshotData(
      accidentallyDeletedFromSnapshot
    )
    console.log(
      'these are accidentally deleted videos from snapshot',
      newDataToSnapshotDB
    )
    await postDelayedRequests(newDataToSnapshotDB, postToNotionSnapshot, 350)
  }

  if (
    !conditions.deletedFromMain &&
    !conditions.newYoutubeVideos &&
    !conditions.deletedFromSnapshot
  ) {
    res.json({
      message: 'everything is in sync!',
    })
  }
}

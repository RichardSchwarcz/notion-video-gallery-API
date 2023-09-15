import { Request, Response } from 'express'
import { getNotionIDs } from '../utils/notionHelpers'
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
  DifferenceObject,
  findDeletedVideos,
  findPlaylistItemsIDsInSnapshotToDelete,
} from '../utils/syncHelpers'
import { PLAYLIST_ID } from '../constants'

//! handle duplicate videos
//! handle deleting videos directly from youtube

// TODO check passing access token from middleware to this function
export async function sync(
  req: Request,
  res: Response,
  mainData: any,
  snapshotData: any
) {
  const cookieHeader = req.headers.cookie

  if (!cookieHeader || typeof cookieHeader !== 'string') {
    console.log('Cookie header is missing or not a string.')
    return
  }

  const parsedCookies = parse(cookieHeader)
  const { access_token } = parsedCookies

  const {
    notionMainDataIDs,
    notionMainVideosIDs,
    notionSnapshotDataIDs,
    notionSnapshotVideosIDs,
  } = getNotionIDs(mainData, snapshotData)

  //* compare main and snapshot -> see which videos have been deleted from main
  const difference: DifferenceObject = findDeletedVideos(
    notionMainDataIDs,
    notionSnapshotDataIDs
  )

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

  // format new videos
  const newFormattedVideos: PlaylistItem[] =
    formatPlaylistItems(newRawPlaylistItems)
  console.log('these are all new formatted videos: ', newFormattedVideos)

  const isDeletedFromMain = difference.deletedFromMain.length > 0
  const hasNewYoutubeVideos = newFormattedVideos.length > 0
  const isDeletedFromSnapshot = difference.deletedFromSnapshot.length > 0

  // -----------------------------------------------------------------------------------------

  let messageObject = {}

  if (isDeletedFromMain) {
    //* get video ID as playlist item from snapshot data
    // each video in youtube playlist has its own unique ID for that playlist
    const playlistItemsIDsToDelete = findPlaylistItemsIDsInSnapshotToDelete(
      difference.deletedFromMain,
      snapshotData
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

    console.log('removing difference deleting from snapshot')
    const notionPagesIDs = difference.deletedFromMain.map(
      (page) => page.notionPageID
    )
    await postDelayedRequests(notionPagesIDs, archiveNotionPage, 350)

    const message = {
      message_deleted: 'deleted following videos from youtube playlist',
      videos_deleted: difference.deletedFromMain,
    }
    Object.assign(messageObject, message)
  }

  if (hasNewYoutubeVideos) {
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

    //* post to notion main DB (new video objects)
    console.log('posting new video to main - only add case')
    const newDataToMainDB = combineVideoArrays(newFormattedVideos, durations)
    await postDelayedRequests(newDataToMainDB, postToNotionDatabase, 350)

    //* post to notion snapshot DB (new video objects)
    console.log('posting new video to snapshot - only add case')
    const newDataToSnapshotDB = formatSnapshotData(newRawPlaylistItems)
    await postDelayedRequests(newDataToSnapshotDB, postToNotionSnapshot, 350)

    const message = {
      message_added_new: 'new videos added',
      videos_added_new: newDataToMainDB,
    }
    Object.assign(messageObject, message)
  }

  const accidentallyDeletedFromSnapshot = rawPlaylistItems.filter(
    (video: RawPlaylistItem) => {
      return (
        !notionSnapshotVideosIDs.includes(video.snippet.resourceId.videoId) &&
        notionMainVideosIDs.includes(video.snippet.resourceId.videoId)
      )
    }
  )

  if (isDeletedFromSnapshot) {
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

    const message = {
      message_added_to_snapshot:
        'accidentally deleted videos added back to snapshot DB',
      videos_added_to_snapshot: newDataToSnapshotDB,
    }
    Object.assign(messageObject, message)
  }

  if (!isDeletedFromMain && !hasNewYoutubeVideos && !isDeletedFromSnapshot) {
    const message = {
      message: 'everything is in sync!',
    }
    Object.assign(messageObject, message)
  }
  res.json(messageObject)
}

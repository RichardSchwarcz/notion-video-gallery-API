import { VideoDuration, PlaylistItem } from '../types/videoTypes'

export function formatPlaylistItems(videoArray: any): PlaylistItem[] {
  return videoArray.map((video: any) => {
    const videoId = video.snippet.resourceId.videoId
    const title = video.snippet.title
    const thumbnail = video.snippet.thumbnails.high.url
    const url = `https://www.youtube.com/watch?v=${videoId}`
    const videoOwnerChannelTitle = video.snippet.videoOwnerChannelTitle

    return {
      videoId,
      title,
      thumbnail,
      url,
      videoOwnerChannelTitle,
    }
  })
}

export function getYoutubeVideosDuration(videoArray: any): VideoDuration[] {
  return videoArray.map((video: any) => {
    const duration = video.contentDetails.duration
    const parsedDuration = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)

    let hours = 0
    let minutes = 0
    let seconds = 0

    if (parsedDuration[1]) {
      hours = parseInt(parsedDuration[1].replace('H', ''))
    }

    if (parsedDuration[2]) {
      minutes = parseInt(parsedDuration[2].replace('M', ''))
    }

    if (parsedDuration[3]) {
      seconds = parseInt(parsedDuration[3].replace('S', ''))
    }

    return {
      id: video.id,
      duration: `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
    }
  })
}

export const getVideosIds = (formattedVideos: PlaylistItem[]): string[] => {
  return formattedVideos.map((video: PlaylistItem) => {
    return video.videoId
  })
}

export function getYoutubeVideoIDfromURL(URL: string) {
  const regex = /(?:v=|\/)([a-zA-Z0-9_-]{11})/
  const match = URL.match(regex)
  if (match) {
    return match[1]
  } else {
    console.log('invalid URL')
  }
}

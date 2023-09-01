export type VideoSchema = {
  videoId: string
  title: string
  thumbnail: string
  url: string
  videoOwnerChannelTitle: string
  duration: string
}

const PART = {
  snippet: 'snippet',
  contentDetails: 'contentDetails',
} as const

type Part = keyof typeof PART

export type VideosOptions = {
  part: Part
  maxResults: string
  id?: string[]
  playlistId?: string
  pageToken?: string
}

export type PlaylistItem = Omit<VideoSchema, 'duration'>

export type VideoDuration = {
  id: string
  duration: string
}

export type RawPlaylistItem = {
  kind: string
  etag: string
  id: string
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    thumbnails: {
      default: {
        url: string
        width: number
        height: number
      }
      medium: {
        url: string
        width: number
        height: number
      }
      high: {
        url: string
        width: number
        height: number
      }
      standard: {
        url: string
        width: number
        height: number
      }
      maxres: {
        url: string
        width: number
        height: number
      }
    }
    channelTitle: string
    playlistId: string
    position: number
    resourceId: {
      kind: string
      videoId: string
    }
    videoOwnerChannelTitle: string
    videoOwnerChannelId: string
  }
}

export type RawVideoData = {
  kind: string
  etag: string
  id: string
  contentDetails: {
    duration: string
    dimension: string
    definition: string
    caption: string
    licensedContent: boolean
    contentRating: {}
    projection: string
  }
}

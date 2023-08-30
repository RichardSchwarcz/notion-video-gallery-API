export interface VideoSchema {
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

export interface PlaylistItem extends Omit<VideoSchema, 'duration'> {}

export interface VideoDuration {
  id: string
  duration: string
}

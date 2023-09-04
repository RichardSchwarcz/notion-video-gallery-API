export function getNotionDataIDs(notionData: any): NotionDataIDs[] {
  return notionData.results.map((video: any) => {
    const notionPageID = video.id
    const url = video.properties.URL.url
    const regex = /(?:v=|\/)([a-zA-Z0-9_-]{11})/
    const match = url.match(regex)
    const youtubeVideoID = match[1]
    return { notionPageID, youtubeVideoID }
  })
}

export type NotionDataIDs = {
  notionPageID: string
  youtubeVideoID: string
}

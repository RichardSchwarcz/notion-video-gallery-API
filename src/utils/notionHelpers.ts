export function getNotionDataIDs(notionData: any): string[] {
  return notionData.results.map((video: any) => {
    const url = video.properties.URL.url
    const regex = /(?:v=|\/)([a-zA-Z0-9_-]{11})/
    const match = url.match(regex)
    if (match) {
      return match[1]
    }
  })
}

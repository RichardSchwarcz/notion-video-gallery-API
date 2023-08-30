import { formatYoutubeVideos, getYoutubeVideosDuration } from './youtubeHelpers'

describe('formatYoutubeVideos', () => {
  it('should format video array correctly', () => {
    const videoArray = [
      {
        kind: 'youtube#playlistItem',
        etag: '0jfyp-wxTcadldJccb42ofbmA7Q',
        id: 'UExvZ1lBYlh4cGNzd0N4N2xpQ3lqdjA1bkdQZ2dOaUxPaC41NkI0NEY2RDEwNTU3Q0M2',
        snippet: {
          publishedAt: '2023-06-13T12:51:17Z',
          channelId: 'UCabcAC0i2m3djVh-kL-ziqA',
          title:
            'T3 Stack Tutorial - FROM 0 TO PROD FOR $0 (Next.js, tRPC, TypeScript, Tailwind, Prisma & More)',
          description: "I've never worked this hard on a video before.",
          thumbnails: {
            default: {
              url: 'https://i.ytimg.com/vi/YkOSUVzOAA4/default.jpg',
              width: 120,
              height: 90,
            },
            medium: {
              url: 'https://i.ytimg.com/vi/YkOSUVzOAA4/mqdefault.jpg',
              width: 320,
              height: 180,
            },
            high: {
              url: 'https://i.ytimg.com/vi/YkOSUVzOAA4/hqdefault.jpg',
              width: 480,
              height: 360,
            },
            standard: {
              url: 'https://i.ytimg.com/vi/YkOSUVzOAA4/sddefault.jpg',
              width: 640,
              height: 480,
            },
            maxres: {
              url: 'https://i.ytimg.com/vi/YkOSUVzOAA4/maxresdefault.jpg',
              width: 1280,
              height: 720,
            },
          },
          channelTitle: 'Riso',
          playlistId: 'PLv05nGPggNiLOh',
          position: 0,
          resourceId: {
            kind: 'youtube#video',
            videoId: 'YkOSUVzOAA4',
          },
          videoOwnerChannelTitle: 'Theo - t3․gg',
          videoOwnerChannelId: 'UCbRP3c757lWg9M-U7TyEkXA',
        },
      },
      {
        kind: 'youtube#playlistItem',
        etag: 'TTbyu4Db1JDi2NCDhDbxtPZht8I',
        id: 'UExvZ1lBYlh4cGNzd0N4N2xpQ3lqdjA1bkdQZ2dOaUxPaC41MjE1MkI0OTQ2QzJGNzNG',
        snippet: {
          publishedAt: '2023-06-13T12:52:01Z',
          channelId: 'UCabcAC0i2m3djVh-kL-ziqA',
          title: 'Learn tRPC In 45 Minutes',
          description: 'Highlight',
          thumbnails: {
            default: {
              url: 'https://i.ytimg.com/vi/UfUbBWIFdJs/default.jpg',
              width: 120,
              height: 90,
            },
            medium: {
              url: 'https://i.ytimg.com/vi/UfUbBWIFdJs/mqdefault.jpg',
              width: 320,
              height: 180,
            },
            high: {
              url: 'https://i.ytimg.com/vi/UfUbBWIFdJs/hqdefault.jpg',
              width: 480,
              height: 360,
            },
            standard: {
              url: 'https://i.ytimg.com/vi/UfUbBWIFdJs/sddefault.jpg',
              width: 640,
              height: 480,
            },
            maxres: {
              url: 'https://i.ytimg.com/vi/UfUbBWIFdJs/maxresdefault.jpg',
              width: 1280,
              height: 720,
            },
          },
          channelTitle: 'Riso',
          playlistId: 'PLogYAbXPggNiLOh',
          position: 1,
          resourceId: {
            kind: 'youtube#video',
            videoId: 'UfUbBWIFdJs',
          },
          videoOwnerChannelTitle: 'Web Dev Simplified',
          videoOwnerChannelId: 'UCFbNIlppjAuEX4znoulh0Cw',
        },
      },
    ]

    const expectedArray = [
      {
        videoId: 'YkOSUVzOAA4',
        title:
          'T3 Stack Tutorial - FROM 0 TO PROD FOR $0 (Next.js, tRPC, TypeScript, Tailwind, Prisma & More)',
        thumbnail: 'https://i.ytimg.com/vi/YkOSUVzOAA4/hqdefault.jpg',
        url: 'https://www.youtube.com/watch?v=YkOSUVzOAA4',
        videoOwnerChannelTitle: 'Theo - t3․gg',
      },
      {
        videoId: 'UfUbBWIFdJs',
        title: 'Learn tRPC In 45 Minutes',
        thumbnail: 'https://i.ytimg.com/vi/UfUbBWIFdJs/hqdefault.jpg',
        url: 'https://www.youtube.com/watch?v=UfUbBWIFdJs',
        videoOwnerChannelTitle: 'Web Dev Simplified',
      },
    ]

    const formattedArray = formatYoutubeVideos(videoArray)
    expect(formattedArray).toEqual(expectedArray)
  })
})

// ----------------------------------------------------------------

describe('getYoutubeVideosDuration', () => {
  it('should format video duration correctly', () => {
    const videoArray = [
      {
        kind: 'youtube#video',
        etag: 'sL42Xs86bXNb34Vw-sRnl6vMlJk',
        id: 'YkOSUVzOAA4',
        contentDetails: {
          duration: 'PT2H59M3S',
          dimension: '2d',
          definition: 'hd',
          caption: 'false',
          licensedContent: true,
          contentRating: {},
          projection: 'rectangular',
        },
      },
      {
        kind: 'youtube#video',
        etag: 'dQko-o-jUBA4rnuG3Kr7Rkml4oI',
        id: 'UfUbBWIFdJs',
        contentDetails: {
          duration: 'PT45M35S',
          dimension: '2d',
          definition: 'hd',
          caption: 'false',
          licensedContent: true,
          contentRating: {},
          projection: 'rectangular',
        },
      },
    ]

    const expectedArray = [
      {
        id: 'YkOSUVzOAA4',
        duration: '02:59:03',
      },
      {
        id: 'UfUbBWIFdJs',
        duration: '00:45:35',
      },
    ]

    const formattedArray = getYoutubeVideosDuration(videoArray)
    expect(formattedArray).toEqual(expectedArray)
  })
})

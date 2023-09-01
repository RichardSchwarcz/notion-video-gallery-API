export type SnapshotData = {
  object: string
  id: string
  created_time: string
  last_edited_time: string
  created_by: {
    object: string
    id: string
  }
  last_edited_by: {
    object: string
    id: string
  }
  cover: string
  icon: string
  parent: {
    type: string
    database_id: string
  }
  archived: false
  properties: {
    PlaylistItemID: {
      id: string
      type: string
      rich_text: [
        {
          type: string
          text: {
            content: string
            link: string
          }
          annotations: {
            bold: boolean
            italic: boolean
            strikethrough: boolean
            underline: boolean
            code: boolean
            color: string
          }
          plain_text: string
          href: string
        }
      ]
    }
    URL: {
      id: string
      type: string
      url: string
    }
    Name: {
      id: string
      type: string
      title: [
        {
          type: string
          text: {
            content: string
            link: string
          }
          annotations: {
            bold: boolean
            italic: boolean
            strikethrough: boolean
            underline: boolean
            code: boolean
            color: string
          }
          plain_text: string
          href: string
        }
      ]
    }
  }
  url: string
  public_url: string
}

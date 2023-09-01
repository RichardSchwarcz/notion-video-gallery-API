import { Client } from '@notionhq/client'
import { QueryDatabaseParameters } from '@notionhq/client/build/src/api-endpoints'

const notion = new Client({ auth: process.env.NOTION_SECRET })

// ------------- FUNCTIONS ----------------

export async function getNotionDatabaseItems(database_id: string) {
  const params: QueryDatabaseParameters = {
    database_id: database_id,
  }
  return notion.databases.query(params)
}

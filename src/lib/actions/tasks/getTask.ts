import {basicRestCall} from '../../utils/rest'
import {DatabaseClient} from 'marklogic'

export interface Meta {
  // TOOD
}

export interface Relations {
  // TOOD
}

export interface RelatedViews {
  // TOOD
}

export interface DatabaseInfo {
  id: string
  name: string
  meta: Meta
  relations: Relations
  'related-views': RelatedViews
}

export function getTask(client: DatabaseClient, name: string): Promise<DatabaseInfo> {
  return <Promise<DatabaseInfo>> basicRestCall(client, `/manage/v2/tasks/${name}?format=json`, `getTask/${name}`)
}

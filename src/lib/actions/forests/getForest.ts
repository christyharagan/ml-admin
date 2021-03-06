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

export interface ForestInfo {
  id: string
  name: string
  meta: Meta
  relations: Relations
  'related-views': RelatedViews
}

export function getForest(client: DatabaseClient, name: string): Promise<ForestInfo> {
  return <Promise<ForestInfo>> basicRestCall(client, `/manage/v2/forests/${name}?format=json`, `getForest/${name}`)
}

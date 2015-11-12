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

export interface HostInfo {
  id: string
  name: string
  meta: Meta
  relations: Relations
  'related-views': RelatedViews
}

export function getHost(client: DatabaseClient, name: string): Promise<HostInfo> {
  return <Promise<HostInfo>> basicRestCall(client, `/manage/v2/hosts/${name}?format=json`, `getHost/${name}`)
}

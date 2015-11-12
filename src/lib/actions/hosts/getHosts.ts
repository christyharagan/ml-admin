import {basicRestCall} from '../../utils/rest'
import {DatabaseClient} from 'marklogic'

export interface Meta {
  uri: string
  'current-time': string
  'elapsed-time': {
    units: string,
    value: number
  }
  // TOOD
}

export interface Relations {
  // TOOD
}

export interface RelatedViews {
  // TOOD
}

export interface ListItem {
  uriref: string
  roleref: string
  idref: string
  nameref: string
}

export interface ListItems {
  'list-count': {
    units: string
    value: number
  },
  'list-item': ListItem[]
  // TODO
}

export interface HostsInfo {
  'host-default-list': HostInfo
}
export interface HostInfo {
  meta: Meta
  relations: Relations
  'related-views': RelatedViews
  'list-items': ListItems
}

export function getHosts(client: DatabaseClient): Promise<HostsInfo> {
  return <Promise<HostsInfo>> basicRestCall(client, `/manage/v2/hosts?format=json`, `getHosts`)
}

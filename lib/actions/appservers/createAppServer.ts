import {basicRestCall} from '../../utils/rest'
import {Client} from 'marklogic'

export interface ServerConfiguration {
  'server-name': string
  'server-type': string
  'group-name': string
  root: string
  port?: number
  'content-database': string
  enabled?: boolean
  'log-errors'?: boolean
  'default-error-format'?: string
  'error-handler'?: string
  'url-rewriter'?: string
  'rewrite-resolves-globally'?: boolean
  
  // TODO finish this
}

export function createAppServer(client:Client, config:ServerConfiguration):Promise<any> {
  return basicRestCall(client, '/manage/v2/appservers', `createAppServer/${config['server-name']}`, 'POST', config)
}
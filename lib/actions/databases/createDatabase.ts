import {basicRestCall} from '../../utils/rest'
import {Client} from 'marklogic'

export interface DatabaseConfiguration {
  'database-name': string
  enabled?: boolean
  'schema-database'?: string
  'security-database'?: string
  'triggers-database'?: string
  forest?: string[]

  // TODO finish this
}

export function createDatabase(client:Client, config:DatabaseConfiguration):Promise<any> {
  return basicRestCall(client, '/manage/v2/databases', `createDatabase/${config['database-name']}`, 'POST', config, {
    'Content-Type': 'application/json'
  })
}

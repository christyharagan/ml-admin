import {basicRestCall} from '../../utils/rest'
import {DatabaseClient} from 'marklogic'

export interface HostConfiguration {
  'host-name': string
  // TODO finish this
}

export function createHost(client:DatabaseClient, config:HostConfiguration):Promise<any> {
  return basicRestCall(client, '/manage/v2/hosts', `createHost/${config['host-name']}`, 'POST', config, {
    'Content-Type': 'application/json'
  })
}

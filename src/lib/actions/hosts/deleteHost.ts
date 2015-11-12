import {basicRestCall} from '../../utils/rest'
import {DatabaseClient} from 'marklogic'

export function deleteHost(client: DatabaseClient, name: string): Promise<any> {
  return basicRestCall(client, `/manage/v2/hosts/${name}?format=json`, `deleteHost/${name}`, 'DELETE')
}

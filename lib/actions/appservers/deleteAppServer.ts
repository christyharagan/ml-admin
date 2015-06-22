import {basicRestCall} from '../../utils/rest'
import {Client} from 'marklogic'

export function deleteAppServer(client: Client, name: string): Promise<any> {
  return basicRestCall(client, `/manage/v2/appservers/${name}?format=json`, `deleteAppServer/${name}`, 'DELETE')
}
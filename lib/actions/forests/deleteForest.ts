import {basicRestCall} from '../../utils/rest'
import {Client} from 'marklogic'

export function deleteForest(client: Client, name: string): Promise<any> {
  return basicRestCall(client, `/manage/v2/forests/${name}?format=json`, `deleteForest/${name}`, 'DELETE')
}
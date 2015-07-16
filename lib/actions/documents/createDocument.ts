import {basicRestCall, createUrl} from '../../utils/rest'
import {Client} from 'marklogic'

export interface DocumentConfiguration {
  uri: string
  category?: string|string[]
  database?: string
  format?: string
  collection?: string|string[]
  quality?: number

  // TODO finish this
}

export function createDocument(client: Client, config: DocumentConfiguration, content): Promise<any> {
  return new Promise(function(resolve, reject) {
    client.eval(`declareUpdate();xdmp.documentInsert('${config.uri}', content);`).result(resolve, reject)
  })
}

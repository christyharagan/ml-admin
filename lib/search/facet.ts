import {FacetValue, Client, queryBuilder as qb, QueryResult} from 'marklogic'
import {RangeIndex} from '../model/indexes'
import {RangeIndexSpec} from '../model/model'

export class Facet {
  path: string
  name: string
}

export function getFacetValues(client:Client, facet:Facet|typeof Facet, directory?: string): Promise<FacetValue<any>[]> {
  directory = directory || '/'
  if (directory.charAt(directory.length - 1) !== '/') {
    directory += '/'
  }
  let name:string, path:string
  if ((<Facet>facet).path) {
    name = (<Facet>facet).name
    path = (<Facet>facet).path
  } else {
    let _facet:Facet = new (<typeof Facet>facet)()
    name = _facet.name
    path = _facet.path
  }
  return new Promise<FacetValue<any>[]>(function(resolve, reject){
    client.documents.query(
      qb.where(qb.directory(directory))
        .calculate(qb.facet(name, qb.pathIndex(path)))
        .withOptions({categories: 'none'})
    ).result( function(results) {
      resolve((<QueryResult<any>>results[0]).facets.categories.facetValues)
    }, function(e){
      reject(e)
      return e
    })
  })
}

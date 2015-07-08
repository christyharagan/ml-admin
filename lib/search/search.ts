import {Client, queryBuilder as qb, BuiltQuery, QueryResult, Match, FetchedDocument, SparqlQueryResult} from 'marklogic'
import {Facet} from './facet'
import {GeoIndex} from '../model/indexes'
import * as semantic from 'speckle'

export interface FacetValue<T> {
  facet: Facet|typeof Facet
  value: T
}

export interface SearchOptions {
  resultsPerPage?: number
  pageNumber?: number
  content?: boolean
  highlights?: boolean
}

export interface GeoValue {
  radius: number
  long: number
  lat: number
  geoIndex: GeoIndex|typeof GeoIndex
}

export interface SemanticQuery {
  query: semantic.Query
  ruleSet: string
  resultPrefix: string
}

export interface Query {
  query?: string
  facetValues?:FacetValue<any>[]
  geoValue?:GeoValue
  semanticQuery?: SemanticQuery
}

export interface SearchResult<T> {
  uri: string
  format: string

  index?: number
  path?: string
  score?: number
  confidence?: number
  fitness?: number
  matches?: Match[]

  contentLength?: string
  content?: T
}

export interface SearchResults {
  total: number
  results: SearchResult<any>[]
}

export function search(client:Client, query: Query, options?: SearchOptions): Promise<SearchResults> {
  return new Promise(function(resolve, reject){
    function doQuery(uris?:string[]) {
      let whereArgs = []

      let structuredQueries:Query[] = []
      if (query.facetValues) {
        structuredQueries = query.facetValues.map(function(facetValue){
          let path = (<Facet>facetValue.facet).path ? (<Facet>facetValue.facet).path : (<typeof Facet>facetValue.facet).prototype.path
          return qb.term(qb.pathIndex(path), facetValue.value)
        })
      }
      if (query.geoValue) {
        let path = (<GeoIndex>query.geoValue.geoIndex).path ? (<GeoIndex>query.geoValue.geoIndex).path : (<typeof GeoIndex>query.geoValue.geoIndex).prototype.path
        structuredQueries.push(qb.geospatial(qb.geoPath(path), qb.circle(query.geoValue.radius, query.geoValue.lat, query.geoValue.long)))
      }
      if (uris && uris.length > 0) {
        structuredQueries.push(qb.document(uris))
      }
      if (structuredQueries.length === 1) {
        whereArgs[0] = structuredQueries[0]
      } else if (structuredQueries.length > 1) {
        whereArgs[0] = qb.and.apply(qb, structuredQueries)
      }

      if (query.query) {
        whereArgs.push(qb.parsedFrom(query.query))
      }

      let builtQuery:BuiltQuery = qb.where.apply(qb, whereArgs)
      let sliceArgs = []
      if (options.resultsPerPage) {
        sliceArgs = [options.pageNumber || 1, options.resultsPerPage]
      }
      if (options.highlights) {
        sliceArgs.push(qb.snippet())
      }
      if (sliceArgs.length > 0) {
        builtQuery = builtQuery.slice.apply(builtQuery, sliceArgs)
      }

      builtQuery = builtQuery.withOptions({
        categories: options.content ? ['content'] : 'none'
      })

      client.documents.query(builtQuery).result(function(results){
        if (results.length > 0) {
          let start = 0
          let total = 0
          let searchResults: SearchResult<any>[] = []

          if (options.highlights) {
            let queryResult = <QueryResult<any>> results[0]
            start++
            total = queryResult.total

            queryResult.results.forEach(function(result){
              searchResults.push({
                uri: result.uri,
                index:result.index,
                format: result.format,
                path: result.path,
                score: result.score,
                confidence: result.confidence,
                fitness: result.fitness,
                matches: result.matches
              })
            })
          }
          if (options.content) {
            for (let i = start; i < results.length; i++) {
              let fetchedDocument = <FetchedDocument<any>> results[i]
              let result:SearchResult<any>
              if (options.highlights) {
                result = searchResults[i - 1]
              } else {
                result = {
                  uri: fetchedDocument.uri,
                  format: fetchedDocument.format
                }
                searchResults.push(result)
              }
              result.contentLength = fetchedDocument.contentLength
              result.content = fetchedDocument.content
            }
          }

          resolve({
            total: total || searchResults.length,
            results: searchResults
          })
        } else {
          resolve({
            total: 0,results:[]
          })
        }
      }, function(e) {
        reject(e)
        return e
      })
    }

    if (query.semanticQuery) {
      client.graphs.sparql('application/sparql-results+json', query.semanticQuery.query.toSparql()).result(function (result:SparqlQueryResult) {
        // TODO: This needs to be completely changed! Temporary for demo
        let uris = result.results.bindings.map(function(binding){
          let uri = binding[Object.keys(binding)[0]].value
          return uri.substring(query.semanticQuery.resultPrefix.length)
        })
        if (query.query || query.facetValues || query.geoValue) {
          doQuery(uris)
        } else {
          resolve(<SearchResults>{
            total:uris.length,results:uris.map(function(uri){
              return<SearchResult<any>> {
                uri: uri,
                format:'json'
              }
            })
          })
        }
      }, function(error) {
        console.log('sdfdsfdsfds')
        console.log(error)
        reject(error)
        return error
      });
    } else {
      doQuery()
    }

  })
}

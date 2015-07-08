import * as m from './model'
import * as v from './modelVisitor'
import {Client} from 'marklogic'
import {getDatabase} from '../actions/databases/getDatabase'
import {createDatabase, DatabaseConfiguration, RangePathIndex, GeoPathIndex} from '../actions/databases/createDatabase'
import {deleteDatabase} from '../actions/databases/deleteDatabase'
import {clearOrConfigureDatabase, ClearDatabaseOperation} from '../actions/databases/clearOrConfigureDatabase'
import {getForest} from '../actions/forests/getForest'
import {createForest} from '../actions/forests/createForest'
import {deleteForest} from '../actions/forests/deleteForest'
import {getAppServer} from '../actions/appservers/getAppServer'
import {createAppServer, AppServerConfiguration} from '../actions/appservers/createAppServer'
import {deleteAppServer} from '../actions/appservers/deleteAppServer'

export interface Deployer {
  deployDatabase(client: Client, ifExists:m.IF_EXISTS, database:m.DatabaseSpec): Promise<boolean>
  cleanDatabase(client: Client, database:m.DatabaseSpec): Promise<boolean>
  undeployDatabase(client: Client, database:m.DatabaseSpec): Promise<boolean>

  deployForest(client: Client, ifExists:m.IF_EXISTS, forest:m.ForestSpec): Promise<boolean>
  undeployForest(client: Client, forest:m.ForestSpec): Promise<boolean>

  deployServer(client: Client, ifExists:m.IF_EXISTS, server:m.ServerSpec): Promise<boolean>
  undeployServer(client: Client, server:m.ServerSpec): Promise<boolean>
}

function toPromise(promises:Promise<boolean>[]) {
  return Promise.all(promises).then(function(results){
    for (let i = 0; i < results.length; i++) {
      if (!results[i]) {
        return false
      }
    }
    return true
  })
}

function deployDatabase(client: Client, deployer:Deployer, ifExists:m.IF_EXISTS, database:m.DatabaseSpec) {
  return deployer.deployDatabase(client, ifExists, database).then(function(){
    let promises = []
    database.forests.forEach(function(forest){
      promises.push(deployer.deployForest(client, ifExists, forest))
    })
    return toPromise(promises)
  })
}

export function deployModel(client: Client, deployer:Deployer, ifExists:m.IF_EXISTS, model:m.Model): Promise<boolean> {
  let promise:Promise<boolean>
  if (model.securityDatabase) {
    promise = deployDatabase(client, deployer, ifExists, model.databases[model.securityDatabase])
  } else {
    promise = Promise.resolve(true)
  }
  promise = promise.then(function(result){
    if (result){
      let promises:Promise<boolean>[] = []
      v.visitModel({
        onDatabase: function(database:m.DatabaseSpec):void {
          if (database.name !== model.contentDatabase && database.name !== model.securityDatabase) {
            promises.push(deployDatabase(client, deployer, ifExists, database))
          }
        }
      }, model)
      return toPromise(promises)
    } else {
      return false
    }
  })
  if (model.contentDatabase) {
    promise = promise.then(function(result){
      if (result) {
        return deployDatabase(client, deployer, ifExists, model.databases[model.contentDatabase])
      } else {
        return false
      }
    })
  }

  return promise.then(function(result){
    if (result) {
      let promises:Promise<boolean>[] = []
      v.visitModel({
        onServer: function(server){
          promises.push(deployer.deployServer(client, ifExists, server))
        }
      }, model)
      return toPromise(promises)
    } else {
      return false
    }
  })
}

export function cleanDeployment(client: Client, deployer:Deployer, model:m.Model): Promise<boolean> {
  let promises:Promise<boolean>[] = []

  v.visitModel({
    onDatabase: function(database:m.DatabaseSpec):void {
      promises.push(deployer.cleanDatabase(client, database))
    }
  }, model)

  return toPromise(promises)
}

function undeployDatabase(client: Client, deployer:Deployer, database:m.DatabaseSpec) {
  return deployer.undeployDatabase(client, database).then(function(result){
    if (result) {
      let promises:Promise<boolean>[] = []
      database.forests.forEach(function(forest){
        promises.push(deployer.undeployForest(client, forest))
      })
      return toPromise(promises)
    } else {
      return false
    }
  })
}

export function undeployModel(client: Client, deployer:Deployer, model:m.Model): Promise<boolean> {
  let promises:Promise<boolean>[] = []

  v.visitModel({
    onServer: function(server){
      promises.push(deployer.undeployServer(client, server))
    }
  }, model)

  return toPromise(promises).then(function(result){
    if (result) {
      let promise:Promise<boolean>
      if (model.contentDatabase) {
        promise = undeployDatabase(client, deployer, model.databases[model.contentDatabase])
      } else {
        promise = Promise.resolve(true)
      }
      promise = promise.then(function(result){
        if (result) {
          let promises:Promise<boolean>[] = []
          v.visitModel({
            onDatabase: function(database:m.DatabaseSpec):void {
              if (database.name !== model.contentDatabase && database.name !== model.securityDatabase) {
                promises.push(undeployDatabase(client, deployer, database))
              }
            }
          }, model)
          return toPromise(promises)
        } else {
          return false
        }
      })
      if (model.securityDatabase) {
        promise = promise.then(function(result){
          if (result) {
            return undeployDatabase(client, deployer, model.databases[model.securityDatabase])
          } else {
            return false
          }
        })
      }

      return promise
    } else {
      return false
    }
  })
}

export class StandardDeployer implements Deployer {
  deployDatabase(client: Client, ifExists:m.IF_EXISTS, database:m.DatabaseSpec):Promise<boolean> {
    function _createDatabase() {
      let databaseConfig:DatabaseConfiguration = {
        'database-name': database.name,
        'triggers-database': database.triggersDatabase,
        'security-database': database.securityDatabase,
        'schema-database': database.schemaDatabase
      }
      if (database.rangeIndices) {
        databaseConfig['range-path-index'] = database.rangeIndices.map(function(rangeIndex){
          return <RangePathIndex> {
            'path-expression': rangeIndex.path,
            'scalar-type': rangeIndex.scalarType,
            collation: rangeIndex.collation || (rangeIndex.scalarType === 'string' ? 'http://marklogic.com/collation/' : ''),
            'invalid-values': rangeIndex.invalidValues || 'reject',
            'range-value-positions': rangeIndex.rangeValuePositions || false
          }
        })
      }
      if (database.geoIndices) {
        databaseConfig['geospatial-path-index'] = database.geoIndices.map(function(geoIndex){
          return <GeoPathIndex> {
            'path-expression': geoIndex.path,
            'coordinate-system': geoIndex.coordinateSystem || 'wgs84',
            'point-format': geoIndex.pointFormat,
            'invalid-values': geoIndex.invalidValues || 'reject',
            'range-value-positions': geoIndex.rangeValuePositions || false
          }
        })
      }
      if (database.triples) {
        databaseConfig['triple-index'] = true
        databaseConfig['collection-lexicon'] = true
      }
      if (database.defaultRulesets) {
        databaseConfig['default-ruleset'] = database.defaultRulesets.map(function(ruleSet){
          return {location: ruleSet}
        })
      }

      return createDatabase(client, databaseConfig).then(function(){
        return true
      })
    }

    let undeploy = this.undeployDatabase
    let clear = this.cleanDatabase
    return getDatabase(client, database.name).then(function(){
      switch(ifExists) {
        case m.IF_EXISTS.recreate:
          return undeploy(client, database).then(_createDatabase)
        case m.IF_EXISTS.clear:
          return clear(client, database)
        case m.IF_EXISTS.ignore:
          return false
        case m.IF_EXISTS.fail:
          throw `Database ${database.name} already exists`
      }
    }, _createDatabase)

  }
  cleanDatabase(client: Client, database:m.DatabaseSpec):Promise<boolean> {
    return clearOrConfigureDatabase(client, database.name, new ClearDatabaseOperation())
  }
  undeployDatabase(client: Client, database:m.DatabaseSpec):Promise<boolean> {
    return deleteDatabase(client, database.name).then(function(){
      return true
    })
  }

  deployForest(client: Client, ifExists:m.IF_EXISTS, forest:m.ForestSpec):Promise<boolean> {
    function _createForest() {
      return createForest(client, {
        'forest-name': forest.name,
        host: forest.host,
        database: forest.database
      }).then(function(){
        return true
      })
    }

    let undeploy = this.undeployForest
    return getForest(client, forest.name).then(function(){
      switch(ifExists) {
        case m.IF_EXISTS.recreate:
        case m.IF_EXISTS.clear:
          return undeploy(client, forest).then(_createForest)
        case m.IF_EXISTS.ignore:
          return false
        case m.IF_EXISTS.fail:
          throw `Forest ${forest.name} already exists`
      }
    }, _createForest)

  }
  undeployForest(client: Client, forest:m.ForestSpec):Promise<boolean> {
    return deleteForest(client, forest.name).then(function(){
      return true
    })
  }

  deployServer(client: Client, ifExists:m.IF_EXISTS, server:m.ServerSpec):Promise<boolean> {
    function _createServer() {
      return createAppServer(client, {
        'server-name': server.name,
        'server-type': 'http',
        root: '/',
        port: server.port,
        'content-database': server.contentDatabase,
        'modules-database': server.modulesDatabase,
        'group-name': server.group,
        'log-errors': true,
        'default-error-format': 'json',
        'error-handler': '/MarkLogic/rest-api/error-handler.xqy',
        'url-rewriter': '/MarkLogic/rest-api/rewriter.xml',
        'rewrite-resolves-globally': true
      }).then(function(){
        return true
      })
    }

    let undeploy = this.undeployServer
    return getAppServer(client, server.name).then(function(){
      switch(ifExists) {
        case m.IF_EXISTS.recreate:
        case m.IF_EXISTS.clear:
          return undeploy(client, server).then(_createServer)
        case m.IF_EXISTS.ignore:
          return false
        case m.IF_EXISTS.fail:
          throw `Server ${server.name} already exists`
      }
    }, _createServer)
  }
  undeployServer(client: Client, server:m.ServerSpec):Promise<boolean> {
    return deleteAppServer(client, server.name, server.group).then(function(){
      return true
    })
  }
}

import * as m from './model'
import {Client} from 'marklogic'
import * as ml from 'marklogic'
import {AdminConnectionParams, createAdminClient} from '../adminClient'
import {getDatabase} from '../actions/databases/getDatabase'
import {createDatabase, DatabaseConfiguration} from '../actions/databases/createDatabase'
import {deleteDatabase} from '../actions/databases/deleteDatabase'
import {clearOrConfigureDatabase, ClearDatabaseOperation} from '../actions/databases/clearOrConfigureDatabase'
import {createForest} from '../actions/forests/createForest'
import {deleteForest} from '../actions/forests/deleteForest'

export type Constructor = (user:m.User, ...args:any[])=>void

function createClient(user: m.User, spec:m.DatabaseSpec, name:string, port?:number) {
  var connectionOptions: AdminConnectionParams = {
    user: user.name,
    password: user.password
  }
  if (spec.host) {
    connectionOptions.host = spec.host
  }
  connectionOptions.port = port
  return createAdminClient(connectionOptions)
}

export function database(spec:m.DatabaseSpec) {
  return function<T extends Database>(target: T): void {
    target.spec = spec
  }
}

function createBasicDatabase(client:Client, name:string) {
  return createDatabase(client, {
    'database-name': name
  })
}

export class Database implements m.Database {

  protected adminClient:Client

  protected user:m.User

  spec: m.DatabaseSpec

  constructor(user:m.User, spec?: m.DatabaseSpec) {
    this.user = user
    this.spec = this.spec || spec
    this.adminClient = createClient(user, this.spec, this.spec.name, this.spec.adminPort || 8002)
  }

  private checkDatabase(ifExists: m.IF_EXISTS, self:Database, name:string, doCreate:()=>Promise<boolean>) {
    return getDatabase(this.adminClient, this.spec.name).then(function(){
      switch(ifExists) {
        case m.IF_EXISTS.overwrite:
          return doCreate()
        case m.IF_EXISTS.ignore:
          break
        case m.IF_EXISTS.fail:
          throw `Database ${self.spec.name} already exists`
      }
    }).catch(doCreate)
  }

  create(ifExists: m.IF_EXISTS): Promise<boolean> {
    let self = this

    function doCreate():Promise<boolean> {
      let config:DatabaseConfiguration = {
        'database-name': self.spec.name
      }
      let promises = []
      if (self.spec.triggersDatabase) {
        config['triggers-database'] = self.spec.triggersDatabase
        promises.push(self.checkDatabase(ifExists, self, self.spec.triggersDatabase, createBasicDatabase.bind(null, self.adminClient, self.spec.triggersDatabase)))

      }
      if (self.spec.securityDatabase) {
        config['security-database'] = self.spec.securityDatabase
        promises.push(self.checkDatabase(ifExists, self, self.spec.securityDatabase, createBasicDatabase.bind(null, self.adminClient, self.spec.securityDatabase)))
      }
      if (self.spec.schemaDatabase) {
        config['schema-database'] = self.spec.schemaDatabase
        promises.push(self.checkDatabase(ifExists, self, self.spec.schemaDatabase, createBasicDatabase.bind(null, self.adminClient, self.spec.schemaDatabase)))
      }

      return Promise.all(promises).then(function(){
        return createDatabase(self.adminClient, config)
      }).then(function(succeeded){
          let promises = [
          ]

          if (self.spec.forests) {
            self.spec.forests.forEach(function(forest){
              promises.push(createForest(self.adminClient, {
                'forest-name': forest + 'Forest',
                host: self.spec.host || 'localhost',
                database: self.spec.name
              }))
            })
          } else {
            promises.push(createForest(self.adminClient, {
              'forest-name': self.spec.name + 'Forest',
              host: self.spec.host || 'localhost',
              database: self.spec.name
            }))
          }
          if (self.spec.triggersDatabase) {
            if (self.spec.triggersForests) {
              self.spec.triggersForests.forEach(function(forest){
                promises.push(createForest(self.adminClient, {
                  'forest-name': forest + 'Forest',
                  host: self.spec.host || 'localhost',
                  database: self.spec.triggersDatabase
                }))
              })
            } else {
              promises.push(createForest(self.adminClient, {
                'forest-name': self.spec.triggersDatabase + 'Forest',
                host: self.spec.host || 'localhost',
                database: self.spec.triggersDatabase
              }))
            }
          }
          if (self.spec.securityDatabase) {
            if (self.spec.securityForests) {
              self.spec.securityForests.forEach(function(forest){
                promises.push(createForest(self.adminClient, {
                  'forest-name': forest + 'Forest',
                  host: self.spec.host || 'localhost',
                  database: self.spec.securityDatabase
                }))
              })
            } else {
              promises.push(createForest(self.adminClient, {
                'forest-name': self.spec.securityDatabase + 'Forest',
                host: self.spec.host || 'localhost',
                database: self.spec.securityDatabase
              }))
            }
          }
          if (self.spec.schemaDatabase) {
            if (self.spec.schemaForests) {
              self.spec.schemaForests.forEach(function(forest){
                promises.push(createForest(self.adminClient, {
                  'forest-name': forest + 'Forest',
                  host: self.spec.host || 'localhost',
                  database: self.spec.schemaDatabase
                }))
              })
            } else {
              promises.push(createForest(self.adminClient, {
                'forest-name': self.spec.schemaDatabase + 'Forest',
                host: self.spec.host || 'localhost',
                database: self.spec.schemaDatabase
              }))
            }
          }

          return Promise.all(promises).then(function(){
            return true
          })
      })
    }

    return self.checkDatabase(ifExists, this, this.spec.name, doCreate)
  }

  delete(allRelatedDatabases: boolean): Promise<boolean> {
    // TODO: Remove all related databases and forests

    return deleteDatabase(this.adminClient, this.spec.name).then(function(){
      return true
    }, function(){
      return false
    })
  }

  clear(allRelatedDatabases: boolean): Promise<boolean> {
    let promises = []
    if (allRelatedDatabases) {
      if (this.spec.triggersDatabase) {
        promises.push(clearOrConfigureDatabase(this.adminClient, this.spec.triggersDatabase, new ClearDatabaseOperation()))
      }
      if (this.spec.securityDatabase) {
        promises.push(clearOrConfigureDatabase(this.adminClient, this.spec.securityDatabase, new ClearDatabaseOperation()))
      }
      if (this.spec.schemaDatabase) {
        promises.push(clearOrConfigureDatabase(this.adminClient, this.spec.schemaDatabase, new ClearDatabaseOperation()))
      }
    }

    promises.push(clearOrConfigureDatabase(this.adminClient, this.spec.name, new ClearDatabaseOperation()))

    return Promise.all(promises).then(function(){
      return true
    })
  }

  users(): Promise<m.User[]> {
    return null
  }

  addUser(user: m.User): Promise<boolean> {
    return null
  }

  removeUser(username: string): Promise<boolean> {
    return null
  }
}

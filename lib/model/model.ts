import * as ml from 'marklogic'

export interface User {
  name: string
  password: string
}

export interface RangeIndex {

}

export interface GeospatialIndex {

}

export interface TripleIndex {

}

export enum IF_EXISTS {
  overwrite,
  ignore,
  fail
}

export interface DatabaseSpec {
  name: string
  host?: string
  adminPort?: number
  triggersDatabase?: string
  securityDatabase?: string
  schemaDatabase?: string
  forests?: string[]
  triggersForests?: string[]
  securityForests?: string[]
  schemaForests?: string[]
}

export interface Database {
  spec: DatabaseSpec

  create(ifExists: IF_EXISTS): Promise<boolean>

  delete(allRelatedDatabases: boolean): Promise<boolean>

  clear(allRelatedDatabases: boolean): Promise<boolean>

  users(): Promise<User[]>

  addUser(user: User): Promise<boolean>

  removeUser(username: string): Promise<boolean>
}

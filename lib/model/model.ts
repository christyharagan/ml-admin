import * as ml from 'marklogic'

export interface User {
  name: string
  password: string
}

export interface Databases {
  [database:string]:DatabaseSpec
}

export interface Servers {
  [server:string]:ServerSpec
}

export interface Model {
  databases: Databases
  servers: Servers
  contentDatabase?: string
  modulesDatabase?: string
  securityDatabase?: string
  schemaDatabase?: string
  triggersDatabase?: string
  ruleSets?: RuleSet[]
}

export interface RuleSet {
  path: string
  rules: string
}

export enum IF_EXISTS {
  recreate,
  clear,
  ignore,
  fail
}

export interface ForestSpec {
  name: string
  host?: string
  database?: string
}

export interface ServerSpec {
  name: string
  contentDatabase?: string
  modulesDatabase?: string
  host?: string
  port?: number
  group?: string
}

export interface DatabaseSpec {
  name: string
  triggersDatabase?: string
  securityDatabase?: string
  schemaDatabase?: string
  rangeIndices?: RangeIndexSpec[]
  geoIndices?: GeoIndexSpec[]
  forests?: ForestSpec[]
  triples?: boolean
  defaultRulesets?: string[]
}

export interface RangeIndexSpec {
  database?: string
  path: string
  scalarType: string
  collation?: string
  invalidValues?: string
  rangeValuePositions?: boolean
}

export interface GeoIndexSpec {
  database?: string
  path: string
  coordinateSystem?: string
  pointFormat?:string
  invalidValues?: string
  rangeValuePositions?: boolean
}

export interface Document<T> {
  uri:string
  content:T
}

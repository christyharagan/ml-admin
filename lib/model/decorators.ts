import {Pipeline} from './cpf'
import * as m from './model'
import * as s from 'typescript-schema'
import {RangeIndex, GeoIndex} from './indexes'
import {Facet} from '../search/facet'
import * as u from 'uservices'

export function contentDatabase() {
  return function(target:Object, propertyKey:string):void {
  }
}

export function triggersDatabase() {
  return function(target:Object, propertyKey:string):void {
  }
}

export function schemaDatabase() {
  return function(target:Object, propertyKey:string):void {
  }
}

export function modulesDatabase() {
  return function(target:Object, propertyKey:string):void {
  }
}

export function securityDatabase() {
  return function(target:Object, propertyKey:string):void {
  }
}

export enum ScalarType {
  int,
  unsignedInt,
  long,
  unsignedLong,
  float,
  double,
  decimal,
  dateTime,
  time,
  date,
  gYearMonth,
  gYear,
  gMonth,
  gDay,
  yearMonthDuration,
  dayTimeDuration,
  string,
  anyURI
}

export interface RangeIndexedOptions {
  collation?: string
  scalarType?: ScalarType
  path?: string
  facet?: typeof Facet
  class?: typeof RangeIndex
}

export interface GeoIndexedOptions {
  path?: string
  pointFormat?: string
  coordinateSystem?: string
  class?: typeof GeoIndex
}

export interface RuleSetOptions {
  path: string
}

export function mlDeploy() {
  return function(target:any): void {
  }
}

export function geoIndexed(definition?: GeoIndexedOptions) {
  return function(target: Object, propertyKey:string): void {
    if (definition.class) {
      definition.class.prototype.path = definition.path || `/${propertyKey}`
    }
  }
}

export function rangeIndexed(definition?: RangeIndexedOptions) {
  return function(target: Object, propertyKey:string): void {
    if (definition.class) {
      definition.class.prototype.path = definition.path || `/${propertyKey}`
    }
    if (definition.facet) {
      definition.facet.prototype.path = definition.path || `/${propertyKey}`
    }
  }
}

export function ruleSet(definition: RuleSetOptions) {
  return function(target: Object, propertyKey:string, method:TypedPropertyDescriptor<()=>string>): void {
    /*return function() {
      return [definition.path, method()]
    }*/
  }
}

/*export function ruleSets() {
  return function(target: Object, propertyKey:string): void {
  }
}*/

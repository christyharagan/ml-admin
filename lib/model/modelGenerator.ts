import * as s from 'typescript-schema'
import * as m from './model'
import * as d from './decorators'

function toScalarType(rangeOptions:d.RangeIndexedOptions, member:s.ClassMember):string {
  if (rangeOptions.scalarType) {
    switch (rangeOptions.scalarType) {
      case d.ScalarType.int:
        return 'int'
      case d.ScalarType.unsignedInt:
        return 'unsignedInt'
      case d.ScalarType.long:
        return 'long'
      case d.ScalarType.unsignedLong:
        return 'unsignedLong'
      case d.ScalarType.float:
        return 'float'
      case d.ScalarType.double:
        return 'double'
      case d.ScalarType.decimal:
        return 'decimal'
      case d.ScalarType.dateTime:
        return 'dateTime'
      case d.ScalarType.time:
        return 'time'
      case d.ScalarType.date:
        return 'date'
      case d.ScalarType.gYearMonth:
        return 'gYearMonth'
      case d.ScalarType.gYear:
        return 'gYear'
      case d.ScalarType.gMonth:
        return 'gMonth'
      case d.ScalarType.gDay:
        return 'gDay'
      case d.ScalarType.yearMonthDuration:
        return 'yearMonthDuration'
      case d.ScalarType.dayTimeDuration:
        return 'dayTimeDuration'
      case d.ScalarType.string:
        return 'string'
      case d.ScalarType.anyURI:
        return 'anyURI'
    }
  } else {
    switch (member.type.typeKind) {
      case s.TypeKind.STRING:
        return 'string'
      case s.TypeKind.NUMBER:
        return 'float'
      case s.TypeKind.ARRAY:
        let array = <s.ArrayType> member.type
        switch (array.element.typeKind) {
          case s.TypeKind.STRING:
            return 'string'
          case s.TypeKind.NUMBER:
            return 'float'
        }
    }
  }
  return null
}

export function generateModel(schema: s.Schema, definition:Object, defaultHost?: string):m.Model {
  let model:m.Model = {
    databases: {},
    servers: {}
  }

  interface Deployable {
    [name:string]:any
  }

  let rangeIndices:m.RangeIndexSpec[] = []
  let geoIndices:m.GeoIndexSpec[] = []

  let deployableClasses:Deployable = {}
  let databasesByType = {
    content: null,
    triggers: null,
    schema: null,
    security: null,
    modules: null
  }
  interface Databases {
    [memberName:string]:string
  }
  let databases:Databases = {}

  s.schemaVisitor(schema, <s.SchemaVisitor>{
    onClassDecorator: function(decorator: s.Decorator, classSchema: s.Class) {
      if (decorator.decorator === 'mlDeploy') {
        deployableClasses[classSchema.name] = classSchema
      }
    },
    onClassMember: function(memberSchema: s.ClassMember, classSchema?: s.Class, moduleSchema?: s.Module) {
      if (deployableClasses[classSchema.name]) {
        let name = (<s.NamedType>memberSchema.type).name

        // TODO: We should be referencing the interface schema here, not just a name
        switch(name){
          case 'DatabaseSpec':
            let databaseSpec = <m.DatabaseSpec> definition[memberSchema.name]
            model.databases[databaseSpec.name] = databaseSpec
            databases[memberSchema.name] = databaseSpec.name
            if (!databaseSpec.forests || databaseSpec.forests.length === 0) {
              databaseSpec.forests = [{
                name: databaseSpec.name,
                database: databaseSpec.name,
                host: defaultHost
              }]
            }
            break
          case 'ServerSpec':
            let serverSpec = <m.ServerSpec> definition[memberSchema.name]
            if (!serverSpec.group) {
              serverSpec.group = 'Default'
            }
            model.servers[serverSpec.name] = serverSpec
            break
        }
      }
    },
    onClassMemberDecorator: function(decorator:s.Decorator, memberSchema: s.ClassMember, classSchema?: s.Class) {
      switch (decorator.decorator) {
        case 'rangeIndexed':
          let rangeOptions:d.RangeIndexedOptions = (decorator.parameters && decorator.parameters.length > 0) ? s.expressionToLiteral(decorator.parameters[0]) : {}
          let scalarType = toScalarType(rangeOptions, memberSchema)
          if (scalarType) {
            rangeIndices.push({
              path: rangeOptions.path || `/${memberSchema.name}`,
              collation: rangeOptions.collation,
              scalarType: scalarType
            })
          }
          break;
        case 'geoIndexed':
          let geoOptions:d.GeoIndexedOptions = (decorator.parameters && decorator.parameters.length > 0) ? s.expressionToLiteral(decorator.parameters[0]) : {}
          // TODO: Support more than point format (e.g. long-lat-point format)
          let geoIndex:m.GeoIndexSpec = {
            path: geoOptions.path || `/${memberSchema.name}`,
            pointFormat: geoOptions.pointFormat || 'point'
          }
          if (geoOptions.coordinateSystem) {
            geoIndex.coordinateSystem = geoOptions.coordinateSystem
          }
          geoIndices.push(geoIndex)
          break;
        case 'contentDatabase':
          databasesByType.content = memberSchema.name
          break;
        case 'triggersDatabase':
          databasesByType.triggers = memberSchema.name
          break;
        case 'schemaDatabase':
          databasesByType.schema = memberSchema.name
          break;
        case 'securityDatabase':
          databasesByType.security = memberSchema.name
          break;
        case 'modulesDatabase':
          databasesByType.modules = memberSchema.name
          break;
      }
    }
  })

  if (databasesByType.security) {
    model.securityDatabase = databases[databasesByType.security]
    Object.keys(databasesByType).forEach(function(key){
      if (key !== 'security' && databasesByType[key]) {
        model.databases[databasesByType[key]].securityDatabase = databases[databasesByType.security]
      }
    })
  }
  if (databasesByType.modules) {
    model.modulesDatabase = databases[databasesByType.modules]
    Object.keys(model.servers).forEach(function(serverName){
      model.servers[serverName].modulesDatabase = databases[databasesByType.modules]
    })
  }
  if (databasesByType.schema) {
    model.schemaDatabase = databases[databasesByType.schema]
  }
  if (databasesByType.triggers) {
    model.triggersDatabase = databases[databasesByType.triggers]
  }
  if (databasesByType.content) {
    model.contentDatabase = databases[databasesByType.content]
    Object.keys(model.servers).forEach(function(serverName){
      model.servers[serverName].contentDatabase = databases[databasesByType.content]
    })
    let contentDatabase = model.databases[databases[databasesByType.content]]
    if (databasesByType.schema) {
      contentDatabase.schemaDatabase = databases[databasesByType.schema]
    }
    if (databasesByType.triggers) {
      contentDatabase.triggersDatabase = databases[databasesByType.triggers]
    }
    contentDatabase.rangeIndices = contentDatabase.rangeIndices || []
    contentDatabase.geoIndices = contentDatabase.geoIndices || []
    rangeIndices.forEach(function(rangeIndex){
      contentDatabase.rangeIndices.push(rangeIndex)
    })
    geoIndices.forEach(function(geoIndex){
      contentDatabase.geoIndices.push(geoIndex)
    })
  }

  return model
}

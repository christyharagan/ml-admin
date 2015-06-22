import {DatabaseSpec} from './model'
import * as s from 'typescript-schema'

export function generateDatabaseSpec(schema: s.Schema, moduleSchema: s.ModuleSchema): DatabaseSpec {
  let databaseSpec:DatabaseSpec
  s.moduleSchemaVisitor(moduleSchema, {
    onClassDecorator: function(decoratorSchema: s.DecoratorSchema, classSchema: s.ClassSchema) {
      if (decoratorSchema.decorator === 'database') {
        databaseSpec = s.expressionToLiteral(decoratorSchema.parameters[0])
      }
    }
  })
  return databaseSpec
}

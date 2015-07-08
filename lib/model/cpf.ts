import * as model from './model'

export interface Pipeline<In, Out> {
  transform(input:model.Document<In>):model.Document<Out>[]
}

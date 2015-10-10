declare module 'marklogic' {
  namespace operation {
    interface OperationOptions {
      method: string,
      path: string,
      headers?: {[header: string]: string}
    }
  }
}

declare module 'marklogic/lib/operation' {
  import {DatabaseClient, operation} from 'marklogic'

  class Operation {
    constructor(name:string, client:DatabaseClient, options:operation.OperationOptions, requestType:string, responseType:string)

    requestBody:string
  }
  export = Operation
}

declare module 'marklogic/lib/requester' {
  import Operation = require('marklogic/lib/operation')
  import {ResultProvider} from 'marklogic'
  function startRequest(operation:Operation):ResultProvider<string>
}

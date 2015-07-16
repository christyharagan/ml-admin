import {basicRestCall, createUrl} from '../../utils/rest'
import {Client} from 'marklogic'

export interface RuleSetConfiguration {
  path: string
}

export function createRuleSet(client: Client, config: RuleSetConfiguration, ruleSet:string): Promise<boolean> {
  return new Promise(function(resolve, reject) {
    client.eval(`
declareUpdate();
var textNode = new NodeBuilder();
textNode.addText('${ruleSet}');
textNode = textNode.toNode();
xdmp.documentInsert('${config.path}', textNode);`).result(function(){
    resolve(true)
  }, function(e){
    reject(e)
    return e
    })
  })
}

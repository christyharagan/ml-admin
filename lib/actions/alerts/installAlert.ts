import {basicRestCall} from '../../utils/rest'
import {getModule} from '../modules/getModule'
import {installModule} from '../modules/installModule'
import {Client} from 'marklogic'

export enum TRIGGER_COMMIT {
  PRE, POST
}

export interface AlertConfig {
  alertName: string
  alertDescription?: string
  alertUri: string

  actionName: string
  actionDescription?: string
  actionModule: string

  ruleName?: string
  ruleDescription?: string
  ruleModule?: string

  triggerScope?: string
  triggerStates?: string[]
  triggerDepth?: number
  triggerCommit?: TRIGGER_COMMIT
  triggerDomain?: string
}

const RUN_SJS_PATH = '/mlAdmin/alert-run-sjs.xqy'
const RUN_SJS_CODE = `
  xquery version '1.0-ml';

  import module "http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";
  declare namespace alert = "http://marklogic.com/xdmp/alert";

  declare variable $alert:doc as node() external;
  declare variable $alert:action as element(alert:action) external;

  let $module := $alert:action/alert:options/alert:sjs-module/text()
  (:let $run-module := "var m; var uri; var doc; require(m)(uri, doc);":)
  (:let $run-module := "require('/ext/testModules/createTestDoc.sjs')(m, doc);":)
  let $run-module := "require(m.toString().trim())(uri.toString().trim(), doc);"
  let $uri := fn:document-uri($alert:doc)

 return xdmp:javascript-eval($run-module, ("m", $module, "uri", $uri, "doc", $alert:doc))`
//  return xdmp:document-insert("blah.xml", <hello>{$uri}</hello>)`
//  return xdmp:document-insert("blah.xml", <hello><mod>{$module}</mod><uri>$uri</uri><doc>{$alert:doc}</doc></hello>)`

export function installAlert(client: Client, config: AlertConfig) {
  return getModule(client, RUN_SJS_PATH).catch(function() {
    return installModule(client, RUN_SJS_PATH, RUN_SJS_CODE)
  }).then(function() {
    //     if (config.triggerScope) {
    //       let states;
    //       if (config.triggerStates) {
    //         states = `"${config.triggerStates[0]}"`
    //         for (let i = 1; i < config.triggerStates.length; i++) {
    //           states += `, "${config.triggerStates[i]}"`
    //         }
    //       } else {
    //         states = '"create", "modify"'
    //       }
    //       let makeTrigger = `
    // trgr:create-trigger("${config.alertName}", "${config.alertDescription}",
    //   trgr:trigger-data-event(
    //       trgr:directory-scope("${config.triggerScope}", "${config.triggerDepth === undefined || config.triggerDepth < 0 ? 'infinity' : config.triggerDepth}"),
    //       trgr:document-content((${states})),
    //       trgr:${config.triggerCommit === TRIGGER_COMMIT.POST ? 'post' : 'pre'}-commit()),
    //   trgr:trigger-module(xdmp:modules-database(), xdmp:modules-root(), "/ext${RUN_SJS_PATH}"),
    //   fn:true(), xdmp:default-permissions() )
    // `
    //     } else {

    //     }
    let makeConfig = `
  xquery version "1.0-ml";
  import module namespace alert = "http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";
  let $config := alert:make-config(
    "${config.alertUri}",
    "${config.alertName}",
    "${config.alertDescription || ''}",
    <alert:options/> )
  return alert:config-insert($config)`

    return new Promise(function(resolve, reject) {
      client.xqueryEval(makeConfig).result(resolve, reject)
    })
  }).then(function() {
    let makeAction = `
  xquery version "1.0-ml";
  import module namespace alert = "http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";
  let $action-log := alert:make-log-action()
  let $action := alert:make-action(
    "${config.actionName}",
    "${config.actionDescription || ''}",
    xdmp:modules-database(),
    xdmp:modules-root(),
    "/ext${RUN_SJS_PATH}",
    <alert:options>
      <alert:sjs-module>${config.actionModule}</alert:sjs-module>
    </alert:options>
  )
  return (alert:action-insert("${config.alertUri}", $action-log),alert:action-insert("${config.alertUri}", $action))`

    return new Promise(function(resolve, reject) {
      client.xqueryEval(makeAction).result(resolve, reject)
    })
  }).then(function() {
    if (config.triggerScope) {
      console.log('dfdfd')
      let makeRules = `
xquery version "1.0-ml";
import module namespace alert = "http://marklogic.com/xdmp/alert"
		  at "/MarkLogic/alert.xqy";

let $rule := alert:make-rule(
    "${config.alertName}",
    "${config.alertDescription}",
    0,
    cts:directory-query(("${config.triggerScope}"),"1"),
    "${config.actionName}",
    <alert:options/> )
return alert:rule-insert("${config.alertUri}", $rule)`

      return new Promise(function(resolve, reject) {
      client.xqueryEval(makeRules).result(resolve, reject)
    })
    } else {
      // TODO: Handle rules
    }
  }).then(function() {
          let states;
      if (config.triggerStates) {
        states = `"${config.triggerStates[0]}"`
        for (let i = 1; i < config.triggerStates.length; i++) {
          states += `, "${config.triggerStates[i]}"`
        }
      } else {
        states = '"create", "modify"'
      }
      let makeTrigger = `
  xquery version "1.0-ml";
  import module namespace alert = "http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";
  import module namespace trgr = "http://marklogic.com/xdmp/triggers" at "/MarkLogic/triggers.xqy";
  let $uri := "${config.alertUri}"
  let $trigger-ids := alert:create-triggers(
    $uri,
    trgr:trigger-data-event(
      trgr:directory-scope("${config.triggerScope}", "${config.triggerDepth === undefined || config.triggerDepth < 0 ? 'infinity' : config.triggerDepth}"),
      trgr:document-content((${states})),
      trgr:${config.triggerCommit === TRIGGER_COMMIT.POST ? 'post' : 'pre'}-commit()
    )
  )
  let $config := alert:config-get($uri)
  let $config := alert:config-set-trigger-ids($config, $trigger-ids)
  return alert:config-insert($config)`

      return new Promise(function(resolve, reject) {
        client.xqueryEval(makeTrigger).result(resolve, reject)
      })



  //   let makeCpf = `
  // xquery version "1.0-ml";
  // import module namespace alert = "http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";
  // let $uri := "${config.alertUri}"
  // let $config := alert:config-get($uri)
  // let $config := alert:config-set-cpf-domain-names($config, (${config.triggerDomain || '"Default Documents"'}))
  // return alert:config-insert($config)`

  //   return new Promise(function(resolve, reject) {
  //     client.xqueryEval(makeCpf).result(resolve).catch(reject)
  //   })
  })
}

/*
 * Copyright 2022, Nuance, Inc. and its contributors.
 * All rights reserved.
 *
 * This source code is licensed under the Apache-2.0 license found in
 * the LICENSE file in the root directory of this source tree.
 */

import chalk from 'chalk'
import {cli} from 'cli-ux'
import {flags} from '@oclif/command'
import makeDebug from 'debug'

import * as DeploymentFlowsAPI from '../../mix/api/deployment-flows'
import * as MixFlags from '../../utils/flags'
import MixCommand from '../../utils/base/mix-command'
import {defaultLimit} from '../../utils/constants'
import {DeploymentFlowsListParams, MixClient, MixResponse, MixResult} from '../../mix/types'
import {pluralize as s} from '../../utils/format'
import {DomainOption} from '../../utils/validations'

const debug = makeDebug('mix:commands:deployment-flows:list')

export default class DeploymentFlowsList extends MixCommand {
  static description = `list deployment flows
  
Use this command to list all deployment flows for a specific organization.
The organization ID can be retrieved by using the organizations:list command.`

  static examples = [
    'mix deployment-flows:list -O 64',
  ]

  static flags = {
    json: MixFlags.jsonFlag,
    ...MixFlags.limitOffsetSortFlags,
    organization: MixFlags.organizationWithDefaultFlag,
    ...MixFlags.tableFlags({except: ['extended', 'no-header', 'filter', 'sort']}),
    yaml: MixFlags.yamlFlag,
  }

  get columns() {
    debug('get columns()')

    const additionalCSVOutputColumns = {
      flowDisplayName: {header: 'DeploymentFlowName'},
      flowId: {header: 'DeploymentFlowId'},
    }

    return {
      ...(this.selectedFormat === 'csv' ? additionalCSVOutputColumns : {}),
      step: {header: 'StepOrder'},
      id: {header: 'StepId'},
      requiresApproval: {header: 'RequiresApproval'},
      environments: {
        header: 'EnvironmentGeographies',
        get: ({environments}: any) =>
          environments.map(({displayName, geographies}: any) =>
            geographies.map(({geography}: any) =>
              `${displayName}@${geography.displayName}` ?? 'n/a').sort((a: string, b: string) =>
              a.localeCompare(b)).join(', ')).join('|'),
      },
    }
  }

  get domainOptions(): DomainOption[] {
    debug('get domainOptions()')
    return ['limit', 'offset', 'organization']
  }

  async buildRequestParameters(options: Partial<flags.Output>): Promise<DeploymentFlowsListParams> {
    debug('buildRequestParameters()')
    const {limit = defaultLimit, offset, organization: orgId, sort: sortBy} = options

    return {
      ...(limit ? {limit} : {}),
      ...(offset ? {offset} : {}),
      orgId,
      ...(sortBy ? {sortBy} : {}),
    }
  }

  captureOptions() {
    debug('captureOptions()')
    const {flags} = this.parse(DeploymentFlowsList)
    this.options = flags
  }

  doRequest(client: MixClient, params: DeploymentFlowsListParams): Promise<MixResponse> {
    debug('doRequest()')
    return DeploymentFlowsAPI.listDeploymentFlows(client, params)
  }

  outputHumanReadable(transformedData: any) {
    debug('outputHumanReadable()')

    const {columns, context,  options} = this
    const count: number = context.get('count')
    const totalSize: number = context.get('totalSize')
    const flows = transformedData

    const size = flows.length
    if (size > 0) {
      for (const [idx, flow] of flows.entries()) {
        this.log(chalk.cyan.bold(`Steps for flow ${flow.displayName} (ID: ${flow.id})`))
        cli.table(flow.steps, columns, options)
        if (idx !== flows.length - 1) {
          this.log()
        }
      }

      if (totalSize > count) {
        this.log(`\nShowing ${chalk.cyan(count)} of ${totalSize} deployment${s(count)} flows.\n`)
      }
    } else {
      this.log(`No deployment flows found for organization ${chalk.cyan(options.organization)}`)
    }
  }

  outputCSV(transformedData: any) {
    debug('outputCSV()')
    const csvData = []

    for (const flow of transformedData) {
      for (const step of flow.steps) {
        const rowData = {
          flowDisplayName: flow.displayName,
          flowId: flow.id,
          step: step.step,
          id: step.id,
          requiresApproval: step.requiresApproval,
          environments: step.environments}

        csvData.push(rowData)
      }
    }

    this.outputCLITable(csvData, this.columns)
  }

  setRequestActionMessage(options: any) {
    debug('setRequestActionMessage()')
    this.requestActionMessage = `Retrieving deployment flows for organization ID ${options.organization}`
  }

  transformResponse(result: MixResult) {
    debug('transformResponse()')
    const data = result.data as any
    const {count, totalSize, offset, limit, flows} = data
    this.context.set('count', count)
    this.context.set('offset', offset)
    this.context.set('limit', limit)
    this.context.set('totalSize', totalSize)

    return flows
  }
}

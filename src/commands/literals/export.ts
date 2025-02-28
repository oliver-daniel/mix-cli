/*
 * Copyright 2022, Nuance, Inc. and its contributors.
 * All rights reserved.
 *
 * This source code is licensed under the Apache-2.0 license found in
 * the LICENSE file in the root directory of this source tree.
 */

import {flags} from '@oclif/command'
import makeDebug from 'debug'

import * as LiteralsAPI from '../../mix/api/literals'
import * as MixFlags from '../../utils/flags'
import {asArray} from '../../utils/as-array'
import {DomainOption} from '../../utils/validations'
import {LiteralsExportParams, MixClient, MixResponse} from '../../mix/types'
import MixCommand from '../../utils/base/mix-command'
import {pluralize as s} from '../../utils/format'

const debug = makeDebug('mix:commands:literals:export')

export default class LiteralsExport extends MixCommand {
  static description = `export entity literals
  
Use this command to export literal-value pairs for a specific entity.
It is possible to specify the locale(s) for which the pairs should be exported.

The contents of the exported zip file depend on the role you have been granted
on the Mix platform.`

  static examples = [
    '$ mix literals:export -P 29050 -E DrinkSize -L en-US -f literals.zip --overwrite',
  ]

  static flags = {
    'entity-name': MixFlags.entityFlag,
    filepath: MixFlags.outputFilePathFlag,
    locale: MixFlags.localeMultipleWithDefaultFlag,
    overwrite: MixFlags.overwriteFileFlag,
    project: MixFlags.projectWithDefaultFlag,
  }

  shouldDownloadFile = true

  get domainOptions(): DomainOption[] {
    debug('get domainOptions()')
    return ['locale[]', 'project']
  }

  async buildRequestParameters(options: Partial<flags.Output>): Promise<LiteralsExportParams> {
    debug('buildRequestParameters()')
    const {'entity-name': entityName, locale, project: projectId} = options

    return {entityName, locales: asArray(locale), projectId}
  }

  captureOptions() {
    debug('captureOptions()')
    const {flags} = this.parse(LiteralsExport)
    this.options = flags
    this.options.locale = asArray(this.options.locale)
  }

  doRequest(client: MixClient, params: LiteralsExportParams): Promise<MixResponse> {
    debug('doRequest()')
    return LiteralsAPI.exportLiterals(client, params)
  }

  outputHumanReadable(_transformedData: any) {
    debug('outputHumanReadable()')
    this.log(`Entity literals exported to file ${this.options.filepath}`)
  }

  setRequestActionMessage(options: any) {
    debug('setRequestActionMessage()')
    this.requestActionMessage = `Exporting entity literals from project ID ${options.project}` +
    ` for locale${s(options.locale.length)} ${options.locale}`
  }
}

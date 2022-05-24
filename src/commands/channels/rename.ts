/*
 * Copyright 2022, Nuance, Inc. and its contributors.
 * All rights reserved.
 *
 * This source code is licensed under the Apache-2.0 license found in
 * the LICENSE file in the root directory of this source tree.
 */

import chalk from 'chalk'
import {flags} from '@oclif/command'
import makeDebug from 'debug'

import * as MixFlags from '../../utils/flags'
import * as ChannelsAPI from '../../mix/api/channels'
import {Config} from '../../utils/config'
import {DomainOption} from '../../utils/validations'
import {MixClient, MixRequestParams, MixResponse, SystemVersionParams} from '../../mix/types'
import MixCommand from '../../utils/base/mix-command'
import { Output } from '@oclif/parser/lib/flags'
import { ChannelsRenameParams } from '../../mix/api/channels-types'

const debug = makeDebug('mix:commands:channels:rename')

export default class ChannelsRename extends MixCommand {
    static description = `rename a channel in Mix project
    
    Use this command to change the name of a channel in a project.`

    static examples = ['mix channels:rename -P 1922 --channel ivr --new-name voice']

    static flags = {
        project: MixFlags.projectWithDefaultFlag,
        channel: {
            ...MixFlags.channelMultipleFlag, // REVIEW: not too happy with this
            multiple: false
        },
        'new-name': flags.string({
            required: true,
            description: 'New channel name'
        }),
        ...MixFlags.machineOutputFlags
    }

    get domainOptions(): DomainOption[] {
        debug('get domainOptions()')
        return ['project']
      }

    async buildRequestParameters(options: Partial<Output>): Promise<ChannelsRenameParams> {
        debug('buildRequestParameters()')
        const {'new-name': displayName, project: projectId, channel: channelId} = options

        return {projectId, channelId, displayName}
    }

    captureOptions() {
        debug('captureOptions()')
        const {flags} = this.parse(ChannelsRename)
        this.options = flags
      }

    doRequest(client: MixClient, params: ChannelsRenameParams): Promise<MixResponse> {
        debug('doRequest()')
        return ChannelsAPI.renameChannel(client, params)
    }

    outputHumanReadable(transformedData: any) {
        debug('outputHumanReadable()')
        const {displayName} = transformedData
        this.log(`Channel renamed to ${chalk.cyan(displayName)}.`)
    }
}
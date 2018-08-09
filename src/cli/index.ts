#!/usr/bin/env node

import * as commander from 'commander'
import * as spinners from 'cli-spinners'
import * as ora from 'ora'

commander
  .version('0.0.1')
  .description(`A framework/compiler/bundler for building front-end applications.`)

commander
  .command('start')
  .description(`Start the app in dev mode.`)
  .option('--port <port>', `The localhost port to run on.`)
  .action((command: commander.Command, port: string) => {
    const spinner = ora({
      spinner: spinners.triangle,
      text: 'Starting...',
      color: 'yellow',
    })
    spinner.start()
  })

commander
  .command('build')
  .description(`Build the app for production.`)

commander.parse(process.argv)

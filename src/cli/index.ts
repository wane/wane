#!/usr/bin/env node

import * as commander from 'commander'

commander
  .version('0.0.1')
  .description(`A framework/compiler/bundler for building front-end applications.`)

commander
  .command('start')
  .alias('dev')
  .description(`Start the app in dev mode.`)
  .action(() => {

  })

commander
  .command('build')
  .alias('prod')
  .description(`Build the app for production.`)

if (process.argv.slice(2).length == 0) {
  commander.outputHelp()
  process.exit(1)
}

commander.parse(process.argv)

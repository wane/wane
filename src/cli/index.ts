#!/usr/bin/env node
import * as fs from 'fs-extra'
import * as commander from 'commander'
import start from './start'
import build from './build'

const VERSION = JSON.parse(fs.readFileSync('package.json', 'utf-8')).version

commander
  .version(VERSION)
  .description(`A framework/compiler/bundler for building front-end applications.`)

commander
  .command('start')
  .alias('dev')
  .description(`Start the app in dev mode.`)
  .action(async () => {
    await start()
  })

commander
  .command('build')
  .alias('prod')
  .description(`Build the app for production.`)
  .action(async () => {
    await build()
  })

if (process.argv.slice(2).length == 0) {
  commander.outputHelp()
  process.exit(1)
}

commander.parse(process.argv)

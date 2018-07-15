import helloWorldBasic from './apps/hello-world-basic/test.spec'
import helloWorldWithBinding from './apps/hello-world-with-binding/test.spec'
import counter from './apps/counter/test.spec'
import counterWithBoundaries from './apps/counter-with-boundaries/test.spec'
import twoCounters from './apps/two-counters/test.spec'
import palindromeChecker from './apps/palindrome-checker/test.spec'
import userInfo from './apps/user-info/test.spec'
import fibonacciSequence from './apps/fibonacci-sequence/test.spec'
import crudTable from './apps/crud-table/test.spec'
import helloApi from './apps/hello-api/test.spec'

import * as path from 'path'
import { readFileSync } from 'fs'
import * as Table from 'cli-table'
import * as gzipSize from 'gzip-size'
import * as brotliSize from 'brotli-size'
import chalk from 'chalk'

Error.stackTraceLimit = Infinity

async function run () {
  // Basic apps with basic components, inputs, outputs, events.
  await helloWorldBasic()
  await helloWorldWithBinding()
  await counter()
  await counterWithBoundaries()
  await twoCounters()

  // Basic usages of w:if
  await palindromeChecker()
  await userInfo()

  // Basic usages of w:for
  await fibonacciSequence()
  await crudTable()

  // Basic usages of promises
  await helloApi()
}

async function reportSizes () {
  const apps = [
    'hello-world-basic',
    'hello-world-with-binding',
    'counter',
    'counter-with-boundaries',
    'two-counters',
    'palindrome-checker',
    'user-info',
    'fibonacci-sequence',
    'crud-table',
    'hello-api',
  ]

  const table = new Table({
    head: ['', 'raw', 'gzip', 'brotli'],
    colAligns: ['left', 'right', 'right', 'right'],
    colWidths: [40, 10, 10, 10],
    chars: { 'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
  })

  for (const appName of apps) {
    const pathToApp = path.join(__dirname, 'apps', appName, 'dist', 'index.js')
    try {
      const indexJs = readFileSync(pathToApp, { encoding: 'utf8' })
      const raw: number = indexJs.length
      const gzip: number = gzipSize.sync(indexJs, { level: 9 })
      const brotli: number = brotliSize.sync(indexJs)
      table.push([appName, raw, gzip, brotli])
    } catch (e) {
      console.error(chalk.red(`Count not read ${chalk.bold(appName)}.`))
    }
  }

  console.log(table.toString())
}

run()
  .then(reportSizes)
  .then(() => {
    console.log('Done.')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

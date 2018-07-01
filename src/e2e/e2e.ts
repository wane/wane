import * as path from 'path'
import * as fs from 'fs'
import * as Table from 'cli-table'
import * as gzipSize from 'gzip-size'
import * as brotliSize from 'brotli-size'
import chalk from 'chalk'
import { runTest } from './utils'

Error.stackTraceLimit = Infinity

// process.on('unhandledRejection', (reason, p) => {
//   console.error(chalk.bold.red`Unhandled Rejection at: Promise`, p, `reason: `, reason)
// })

async function run () {

  const appsRoot = 'src/e2e/apps'
  // const allDirs = fs.readdirSync(appsRoot).filter(name => {
  //   return fs.statSync(path.join(appsRoot, name)).isDirectory()
  // })
  const allDirs = ['counter']

  for (const dir of allDirs) {
    try {
      const importPathDir = path.join(__dirname, 'apps', dir)
      const importPath = path.join(importPathDir, 'test.spec')
      const importedModule = await import(importPath)
      const test = importedModule.default
      await runTest(importPathDir, test)
    } catch (e) {
      console.error(chalk.red`A test has failed.`)
      console.error(e)
    }
  }

  // Basic apps with basic components, inputs, outputs, events.
  // await helloWorldBasic()
  // await helloWorldWithBinding()
  // await counter()
  // await counterWithBoundaries()
  // await twoCounters()
  //
  // // Basic usages of w:if
  // await palindromeChecker()
  // await userInfo()
  //
  // // Basic usages of w:for
  // await fibonacciSequence()
  // await crudTable()
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
  ]

  const table = new (Table as any)({
    head: ['', 'raw', 'gzip', 'brotli'],
    colAligns: ['left', 'right', 'right', 'right'],
    colWidths: [40, 10, 10, 10],
    chars: { 'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
  })

  for (const appName of apps) {
    const pathToApp = path.join(__dirname, 'apps', appName, 'dist', 'index.js')
    try {
      const indexJs = fs.readFileSync(pathToApp, { encoding: 'utf8' })
      const raw: number = indexJs.length
      const gzip: number = gzipSize.sync(indexJs, { level: 9 })
      const brotli: number = brotliSize.sync(indexJs)
      table.push([appName, raw, gzip, brotli])
    } catch (e) {
      console.error(chalk.red`Count not read ${chalk.bold(appName)}.`)
    }
  }

  console.log(table.toString())
}

run()
// .then(reportSizes)
  .then(() => {
    console.log('Done.')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

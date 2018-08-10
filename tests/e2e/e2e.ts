import chalk from 'chalk'
import { CompilationResult } from '../../src/compiler/compile'
import * as ora from 'ora'
import numberFormat from 'format-number'
import { getBorderCharacters, table } from 'table'

const f = numberFormat()

Error.stackTraceLimit = Infinity

const APP_NAMES = [
  // Basic apps with basic components, inputs, outputs, events.
  'hello-world-basic',
  'hello-world-with-binding',
  'counter',
  'counter-with-boundaries',
  'two-counters',
  // Basic usages of w:if
  'palindrome-checker',
  'user-info',
  // Basic usages of w:for
  'fibonacci-sequence',
  'crud-table',
  // Basic usages of promises
  'hello-api',
]

const RESULT_DATA: Record<string, CompilationResult | null> = {}

const borderStyle = chalk.white
const appNameStyle = chalk.gray
const brotliSizeStyle = chalk.bold
const notApplicableStyle = chalk
const headingStyle = chalk.bold.gray

async function run () {

  for (const appName of APP_NAMES) {

    const appPath = `./apps/${appName}/test.spec`
    const module = await import(appPath)
    const runTest = module.default

    const spinner = ora({
      text: `${chalk.bold(appName)}: running tests...`,
    })
    spinner.start()

    const result: CompilationResult | null = await runTest()

    if (result != null) {
      RESULT_DATA[appName] = result
      spinner.stopAndPersist({
        symbol: chalk.bold.green('✓'),
        text: `${chalk.green.bold(appName)}: tests passed`,
      })
    } else {
      RESULT_DATA[appName] = null
      spinner.stopAndPersist({
        symbol: chalk.bold.red('✗'),
        text: `${chalk.bold.red(appName)}: tests ${chalk.bgRedBright.whiteBright.bold(`FAILED`)}.`,
      })
    }

  }

  const sizesTableData = Object.keys(RESULT_DATA)
    .map(appName => {
      const report = RESULT_DATA[appName]
      if (report == null) {
        return [
          appNameStyle(appName),
          notApplicableStyle('N/A'),
          notApplicableStyle('N/A'),
          notApplicableStyle('N/A'),
        ]
      } else {
        return [
          appNameStyle(appName),
          f(report.sizes.js.raw),
          f(report.sizes.js.gzip),
          brotliSizeStyle(f(report.sizes.js.brotli)),
        ]
      }
    })

  sizesTableData.unshift([
    '',
    'raw',
    'gzip',
    'brotli',
  ].map(s => headingStyle(s)))

  const prettyTable = table(sizesTableData, {
    columnDefault: {
      alignment: 'right',
      paddingLeft: 3,
      paddingRight: 0,
    },
    columns: {
      0: {
        alignment: 'left',
        paddingRight: 1,
      },
      3: {
        paddingRight: 3,
      },
    },
    border: {
      ...getBorderCharacters('void'),

      topBody: borderStyle('═'),
      topLeft: borderStyle('╔'),
      topRight: borderStyle('╗'),

      bottomBody: borderStyle('═'),
      bottomLeft: borderStyle('╚'),
      bottomRight: borderStyle('╝'),

      bodyLeft: borderStyle('║'),
      bodyRight: borderStyle('║'),

      joinLeft: borderStyle('╟'),
      joinRight: borderStyle('╢'),

      joinBody: borderStyle('─'),
    },
    drawHorizontalLine: (index, size) => [0, 1, size].includes(index),
  })

  console.log(prettyTable)

}

run()
  .then(() => {
    console.log('Done.')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

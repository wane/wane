import * as ora from 'ora'
import chalk from 'chalk'
import { getBorderCharacters, table } from 'table'
import { compile, WaneCompilerOptions } from '../compiler/compile'
import formatNumber from 'format-number'

const f = formatNumber()

const spinner = ora({
  spinner: 'moon',
  text: `Building...`,
  color: 'blue',
})

export default async function build (options: Partial<WaneCompilerOptions> = {}) {

  spinner.start()

  try {
    const result = await compile({
      dir: 'tests/e2e/apps/counter',
    })

    const { sizes } = result

    const left = chalk.gray.italic

    const sizesTable = [
      ['', 'raw', 'gzip', 'brotli'].map(str => chalk.bold.gray(str)),
      [left('*.js'), f(sizes.js.raw), f(sizes.js.gzip), f(sizes.js.brotli)],
      [left('*.css'), f(sizes.css.raw), f(sizes.css.gzip), f(sizes.css.brotli)],
      [left('*.html'), f(sizes.html.raw), f(sizes.html.gzip), f(sizes.html.brotli)],
      [left('total'),
        f(sizes.total.raw),
        f(sizes.total.gzip),
        chalk.bold(`${f(sizes.total.brotli)}`),
      ],
    ]

    const prettyTable = table(sizesTable, {
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

        topBody: chalk.white('═'),
        topLeft: chalk.white('╔'),
        topRight: chalk.white('╗'),

        bottomBody: chalk.white('═'),
        bottomLeft: chalk.white('╚'),
        bottomRight: chalk.white('╝'),

        bodyLeft: chalk.white('║'),
        bodyRight: chalk.white('║'),

        joinLeft: chalk.white('╟'),
        joinRight: chalk.white('╢'),

        joinBody: chalk.white('─'),
      },
      drawHorizontalLine: (index, size) => {
        return [0, 1, size - 1, size].includes(index)
      },
    })

    const timeMs = Math.round(result.durationNs / 1e6)

    spinner.stop()
    console.info(`${chalk.blue.bold('Successfully compiled.')}`)
    console.info(prettyTable)
    console.info(`${chalk.gray(`•`)} The bundle is available in ${chalk.bold(result.filesRoot)}.`)
    console.info(`${chalk.gray(`•`)} Compilation took ${chalk.bold(f(timeMs))}ms.`)

  } catch (e) {
    spinner.stop()
    console.error(chalk.red.bold(`Compilation unsuccessful.`))
    console.error(e)
    process.exit(1)
  }

}

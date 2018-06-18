#!/usr/bin/env node
import chalk from 'chalk'
import { compile } from './compile'

Error.stackTraceLimit = Infinity

compile()
  .then(() => {
    console.info(chalk.bold.green(`✔ Compiled successfully.`))
  })
  .catch((e) => {
    console.error(
      chalk.red(chalk.bold(`❌ An error occurred.`) + ` Project not compiled successfully.`),
    )
    console.error(chalk.red(`There is likely additional output above.`))
    console.error(e)
  })

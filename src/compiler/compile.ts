import * as path from 'path'
import * as fs from 'fs-extra'
import Project, { ModuleKind, ScriptTarget } from 'ts-simple-ast'
import { ProjectAnalyzer } from './analyzer'
import { Codegen } from './codegen'

export interface WaneCompilerOptions {
  dir: string
  input: string
  output: string

  pretty: boolean
}

export function expandCompilerOptions (options: Partial<WaneCompilerOptions>): WaneCompilerOptions {
  const dir = options.dir != null ? options.dir : process.cwd()
  const input = options.input != null ? options.input : path.join(dir, 'src')
  const output = options.output != null ? options.output : path.join(dir, 'dist')

  const pretty = options.pretty != null ? options.pretty : false

  return {
    dir, input, output,
    pretty,
  }
}

function getDirs (options: Partial<WaneCompilerOptions> = {}): { srcDir: string, distDir: string } {
  const { input, output } = expandCompilerOptions(options)
  return { srcDir: input, distDir: output }
}

export function getProjectAnalyzer (waneCompilerOptions: Partial<WaneCompilerOptions> = {}): ProjectAnalyzer {

  // console.log(`Compiling a Wane app with the following options:`)
  // console.log(JSON.stringify(options, null, 2))

  /**
   * Setting up phase. We copy all files from the source to destination directory.
   * Then we manipulate the copies of files.
   */

  const { srcDir, distDir } = getDirs(waneCompilerOptions)

  fs.removeSync(distDir)
  fs.mkdirpSync(distDir)
  fs.copySync(srcDir, distDir)

  /**
   * We load the project (from the desination folder) into a new ts-simple-ast Project.
   */

  const projectOptions = {
    compilerOptions: {
      outDir: distDir,
      experimentalDecorators: true,
      target: ScriptTarget.ES2017,
      module: ModuleKind.ES2015,
      strict: true,
      noFallthroughCasesInSwitch: true,
      noImplicitReturns: true,
      removeComments: false,
      lib: [
        'es2017',
        'dom',
      ],
    },
  }

  const project = new Project(projectOptions)
  project.addExistingSourceFiles(path.join(distDir, '**/*.ts'))

  /**
   * Compiler consists of two parts:
   *   - analyzer, and
   *   - code generator.
   *
   * First create the analyzer by loading the project into,
   * and then use this analyzer to generate code.
   */

  return new ProjectAnalyzer(project, expandCompilerOptions(waneCompilerOptions))

}

export async function compile (options: Partial<WaneCompilerOptions> = {}) {

  const { distDir } = getDirs(options)
  const projectAnalyzer = getProjectAnalyzer(options)
  const codegen = new Codegen(projectAnalyzer, expandCompilerOptions(options))

  /**
   * We can now tell code generator to start the process of generating files.
   * It will use and existing Project that it grabs from the Analyzer.
   */

  await codegen.generateCode()

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Document</title>
  <link href="styles.css" rel="stylesheet">
</head>
<body>
  <script src="index.js"></script>
</body>
</html>`
  fs.writeFileSync(path.join(distDir, 'index.html'), html)

  // const table = new Table({
  //   head: [`Type`, `Raw`, `Gzip`, `Brotli`],
  //   colWidths: [30, 10, 10, 10],
  // })
  // table.push(
  //   [`Wane output (ES6)`, output.length, gzipSize.sync(output), brotliSize.sync(output)],
  //   [`UglifyES (ES6)`, uglified.code.length, gzipSize.sync(uglified.code), brotliSize.sync(uglified.code)],
  // )
  // console.log(table.toString())

}

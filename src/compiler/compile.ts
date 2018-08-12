import * as path from 'path'
import * as fs from 'fs-extra'
import Project, { ModuleKind, ScriptTarget } from 'ts-simple-ast'
import { ProjectAnalyzer } from './analyzer'
import { Codegen } from './codegen'
import getSize, { Size } from './utils/get-sizes'
import { nullish } from './utils/utils'
import readConfig from './config-reader'
import merge from './config-reader/merger'

export interface CompilationResult {
  durationNs: number
  filesRoot: string
  files: string[]
  sizes: {
    js: Size
    css: Size
    html: Size
    total: Size
  }
}

export interface WaneCompilerOptions {
  dir: string
  input: string
  output: string

  pretty: boolean
}

export function expandCompilerOptions (options: Partial<WaneCompilerOptions>): WaneCompilerOptions {
  const dir = options.dir != null ? options.dir : process.cwd()
  const input = path.join(dir, nullish(options.input, 'src'))
  const output = path.join(dir, nullish(options.output, 'dist'))

  const pretty = options.pretty != null ? options.pretty : false

  return {
    dir, input, output,
    pretty,
  }
}

export function getDirs (options: Partial<WaneCompilerOptions> = {}): { srcDir: string, distDir: string } {
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

export async function compile (options: Partial<WaneCompilerOptions> = {}): Promise<CompilationResult> {

  const start = process.hrtime()

  const { dir } = expandCompilerOptions(options)
  const userOptions = readConfig(dir)
  const mergedOptions = {...options, ...userOptions}

  const { distDir } = getDirs(mergedOptions)
  const projectAnalyzer = getProjectAnalyzer(mergedOptions)
  const codegen = new Codegen(projectAnalyzer, expandCompilerOptions(mergedOptions))

  /**
   * We can now tell code generator to start the process of generating files.
   * It will use and existing Project that it grabs from the Analyzer.
   */

  const codegenResult = await codegen.generateCode()

  const htmlFileContent = `<!DOCTYPE html>
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
  fs.writeFileSync(path.join(distDir, 'index.html'), htmlFileContent)

  const diff = process.hrtime(start)
  const durationNs = diff[0] * 1e9 + diff[1]

  const [js, css, html] = ['index.js', 'styles.css', 'index.html']
    .map(filename => path.join(codegenResult.filesRoot, filename))
    .map(getSize)

  const total: Size = {
    raw: js.raw + css.raw + html.raw,
    gzip: js.gzip + css.gzip + html.gzip,
    brotli: js.brotli + css.brotli + html.brotli,
  }

  return {
    durationNs,
    ...codegenResult,
    sizes: {js, css, html, total},
  }

}

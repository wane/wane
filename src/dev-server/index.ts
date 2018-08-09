import * as browserSync from 'browser-sync'
import * as path from 'path'
import * as chokidar from 'chokidar'
import { compile, getDirs, WaneCompilerOptions } from '../compiler/compile'

const browser = browserSync.create('wane-dev-server')

export default function waneDevServer (waneCompilerOptions: Partial<WaneCompilerOptions> = {}) {

  const { srcDir, distDir } = getDirs(waneCompilerOptions)

  // Watch for changes in the source folder and trigger wane's compiler
  // to re-build the app and place the result in the distribution folder.

  const srcWatcher = chokidar.watch(path.join(srcDir, '**', '*'), {
    ignoreInitial: true,
  })

  srcWatcher.on('all', async () => {
    await compile(waneCompilerOptions)
  })

  // Run browser-sync over the dist folder.

  const config: browserSync.Options = {
    files: [path.join(distDir, '..', '**', '*')], // for some reason chokidar loses .js and .css files when only dist folder is looked at
    watch: true,
    watchOptions: {
      ignoreInitial: true,
    },
    server: {
      baseDir: distDir,
    },
    logLevel: 'info',
  }

  const bs = browser.init(config)

  return browserSync

}

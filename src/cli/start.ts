import { getDirs, WaneCompilerOptions } from '../compiler/compile'
import * as path from 'path'
import * as lite from 'lite-server'

export default async function start (options: Partial<WaneCompilerOptions>) {

  const { srcDir, distDir } = getDirs(options)

  lite.server({
    files: [path.join(distDir, '**', '*')],
  })

}

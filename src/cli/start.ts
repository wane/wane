import { getDirs, WaneCompilerOptions } from '../compiler/compile'
import devServer from '../dev-server'

export default async function start (options: Partial<WaneCompilerOptions> = {}) {

  devServer(options)

}

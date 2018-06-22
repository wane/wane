import { compile, WaneCompilerOptions } from '../../../src/compiler/compile'

export async function compileTestApp (opts: Partial<WaneCompilerOptions>) {
  await compile({ pretty: false, ...opts })
}

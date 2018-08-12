import { WaneCompilerOptions } from '../compile'
import { UserConfig } from './index'

export default function merge (userOptions: Partial<UserConfig>, options: Partial<WaneCompilerOptions> = {}): Partial<WaneCompilerOptions> {

  const transformedUserOptions: Partial<WaneCompilerOptions> = {}

  const { build, debug } = userOptions

  if (build != null) {
    if (build.output != null) {
      transformedUserOptions.output = build.output
    }
  }

  if (debug != null) {
    if (debug.pretty != null) {
      transformedUserOptions.pretty = debug.pretty
    }
  }

  return { ...options, ...transformedUserOptions }

}

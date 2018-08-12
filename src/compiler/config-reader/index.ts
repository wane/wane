import * as path from 'path'
import * as fs from 'fs-extra'
import * as toml from 'toml'
import { WaneCompilerOptions } from '../compile'
import merge from './merger'
import * as Joi from 'joi'

interface UserConfig_Build {
  output: WaneCompilerOptions['output']
}

interface UserConfig_Debug {
  pretty: WaneCompilerOptions['pretty']
}

export interface UserConfig {
  build: Partial<UserConfig_Build>
  debug: Partial<UserConfig_Debug>
}

const schema = Joi.object().keys({
  build: Joi.object().keys({
    output: Joi.string(),
  }),
  debug: Joi.object().keys({
    pretty: Joi.boolean(),
  }),
})

export function parseConfig (tomlString: string): Partial<UserConfig> {
  const config = toml.parse(tomlString)
  const { error } = Joi.validate(config, schema)
  if (error == null) {
    return config
  }
  throw new Error(error.message)
}

export default function readConfig (projectDir: string): Partial<WaneCompilerOptions> {
  const configFilePath = path.join(projectDir, 'wane.toml')
  if (fs.existsSync(configFilePath)) {
    const configFileContent = fs.readFileSync(configFilePath, { encoding: 'utf8' })
    const userConfig = parseConfig(configFileContent)
    return merge(userConfig)
  } else {
    return {}
  }
}

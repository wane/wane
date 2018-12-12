import { Io } from '../index'
import * as path from "path"
import { getFixturesAbsolutePath } from './utils'
import * as fs from 'fs'


const files = fs.readdirSync(__dirname)

async function main () {
  const tests: Array<() => void> = []

  for (const file of files) {
    const FIXTURE_SPEC_REGEX = new RegExp(/(?<name>\d+-.*)\.[jt]sx?/g)
    const match = FIXTURE_SPEC_REGEX.exec(file)
    if (match == null) continue
    const {name: fixtureName} = match.groups!

    const fixturePath = path.join(getFixturesAbsolutePath(__dirname), fixtureName)
    const io = new Io(fixturePath)

    const testModule = await import(path.resolve(__dirname, file))
    const testFunction = testModule.default

    tests.push(() => testFunction(io))
  }

  return tests
}

describe(`Io`, async () => {
  try {
    const tests = await main()
    tests.forEach(test => test())
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
})

import { parseConfig, UserConfig } from './index'
import { stripIndent } from 'common-tags'

describe(`parseConfig`, () => {

  it(`works with a simple config`, () => {
    const tomlString = stripIndent`
      [build]
      output = "dist"
      
      [debug]
      pretty = true
    `
    const actual = parseConfig(tomlString)
    const expected: UserConfig = {
      build: {
        output: 'dist',
      },
      debug: {
        pretty: true,
      },
    }
    expect(actual).toEqual(expected)
  })

  it(`throws because of an unknown option within a known section`, () => {
    const tomlString = stripIndent`
      [build]
      unknown = "dist"
    `
    const getActual = () => parseConfig(tomlString)
    expect(getActual).toThrowError(/"unknown" is not allowed/ui)
  })

  it(`throws because of an unknown section`, () => {
    const tomlString = stripIndent`
      [section]
      foo = "bar"
    `
    const getActual = () => parseConfig(tomlString)
    expect(getActual).toThrowError(/"section" is not allowed/ui)
  })

  it(`throws because of a bad type of a known option`, () => {
    const tomlString = stripIndent`
      [build]
      output = true
    `
    const getActual = () => parseConfig(tomlString)
    expect(getActual).toThrowError(/"output" must be a string/ui)
  })

})

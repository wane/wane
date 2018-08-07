import { stripIndent } from 'common-tags'
import { encapsulate, replaceTagNames } from './css'

const resolver = (selector: string) => {
  return selector == 'TransformMe' ? 'transformed-selector' : selector
}

describe(`encapsulate`, () => {

  it(`works with a simple selector`, () => {
    const input = `p { color: red; }`
    const output = `p[data-w-1]{color:red}`
    expect(encapsulate(1, 'foo-cmp', input)).toBe(output)
  })

  it(`works with a selector with only pseudo-class`, () => {
    const input = `:required { color: red; }`
    const output = `:required[data-w-1]{color:red}`
    expect(encapsulate(1, 'foo-cmp', input)).toBe(output)
  })

  it(`works with a selector with only pseudo-element`, () => {
    const input = `::after { color: red; }`
    const output = `[data-w-1]::after{color:red}`
    expect(encapsulate(1, 'foo-cmp', input)).toBe(output)
  })

  it(`works with a universal selector`, () => {
    const input = `* { color: red; }`
    const output = `[data-w-1]{color:red}`
    expect(encapsulate(1, 'foo-cmp', input)).toBe(output)
  })

  it(`works with the lobotomized owl`, () => {
    const input = `* + * { color: red; }`
    const output = `[data-w-1]+[data-w-1]{color:red}`
    expect(encapsulate(1, 'foo-cmp', input)).toBe(output)
  })

  it(`works with the suicidal lobotomized owl`, () => {
    const input = `ul > * + * { color: red; }`
    const output = `ul[data-w-1]>[data-w-1]+[data-w-1]{color:red}`
    expect(encapsulate(1, 'foo-cmp', input)).toBe(output)
  })

  it(`works with commas`, () => {
    const input = `.foo, .bar { color: red; }`
    const output = `.foo[data-w-1],.bar[data-w-1]{color:red}`
    expect(encapsulate(1, 'foo-cmp', input)).toBe(output)
  })

  it(`works with space combinator`, () => {
    const input = `foo bar { color: red; }`
    const output = `foo[data-w-1] bar[data-w-1]{color:red}`
    expect(encapsulate(1, 'foo-cmp', input)).toBe(output)
  })

  it(`works with > combinator`, () => {
    const input = `foo > bar { color: red; }`
    const output = `foo[data-w-1]>bar[data-w-1]{color:red}`
    expect(encapsulate(1, 'foo-cmp', input)).toBe(output)
  })

  it(`works with a complex selector`, () => {
    const input = `p.class#id > input[required]:nth-of-type(2) ~ code.highlight.js::after { color: red; }`
    const output = `p[data-w-1].class#id>input[data-w-1][required]:nth-of-type(2)~code[data-w-1].highlight.js::after{color:red}`
    expect(encapsulate(1, 'foo-cmp', input)).toBe(output)
  })

  it(`works with :not`, () => {
    const input = `.foo:not(.bar) { color: red }`
    const output = `.foo[data-w-1]:not(.bar){color:red}`
    expect(encapsulate(1, 'foo-cmp', input)).toBe(output)
  })

  it(`works with multiple styles`, () => {
    const input = stripIndent`
      .foo { color: red; }
      .bar { color: blue; }
    `
    const output = `.foo[data-w-1]{color:red}.bar[data-w-1]{color:blue}`
    expect(encapsulate(1, 'foo-cmp', input)).toBe(output)
  })

  it(`understands :host`, () => {
    const input = `:host { color: red }`
    const output = `foo-cmp{color:red}`
    expect(encapsulate(1, 'foo-cmp', input)).toBe(output)
  })

})

describe(`replaceTagNames`, () => {

  it(`replaces tag names`, () => {
    const input = `TransformMe ButNotMe { color: red }`
    const output = `transformed-selector ButNotMe{color:red}`
    expect(replaceTagNames(resolver, input)).toBe(output)
  })

})

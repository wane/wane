import { echoize, EchoizeCache } from './echoize'

describe(`EchoizeCache`, () => {

  it(`has no hits initially`, () => {
    const cache = new EchoizeCache()
    expect(cache.get(['a'])).toEqual({ isHit: false })
  })

  it(`has a hit when something is written`, () => {
    const cache = new EchoizeCache()
    cache.set(['a'], 'b')
    expect(cache.get(['a'])).toEqual({ isHit: true, result: 'b' })
  })

  it(`gets hit by deep equality`, () => {
    const cache = new EchoizeCache()
    cache.set([{ foo: { bar: 'baz' } }], 'value')
    expect(cache.get([{ foo: { bar: 'baz' } }])).toEqual({ isHit: true, result: 'value' })
  })

})

describe(`@echoize`, () => {

  it(`should not change outcome of the function`, () => {
    class Foo {
      @echoize() foo () {
        return 1
      }
    }

    expect(new Foo().foo()).toBe(1)
    expect(new Foo().foo()).toBe(1)
  })

  it(`should cache the value based on given arguments`, () => {
    class Foo {
      _count = 0

      @echoize() foo (...args: any[]) {
        return this._count++
      }
    }

    const foo = new Foo()
    expect(foo.foo()).toBe(0)
    expect(foo.foo()).toBe(0)
    expect(foo.foo(1)).toBe(1)
    expect(foo.foo(2)).toBe(2)
    expect(foo.foo()).toBe(0)
    expect(foo.foo(1)).toBe(1)
    expect(foo.foo(1, 1)).toBe(3)
    expect(foo.foo(1)).toBe(1)
  })

})

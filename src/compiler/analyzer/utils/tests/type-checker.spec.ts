import {loadClassFromFile} from './utils'
import {isAssignable} from '../type-checker'
import Project, {ClassDeclaration} from 'ts-simple-ast'
import {stripIndent} from 'common-tags'

function getTypes (klass: ClassDeclaration, dstProp: string, srcProp: string) {
  return {
    dst: klass.getPropertyOrThrow(dstProp).getType(),
    src: klass.getPropertyOrThrow(srcProp).getType(),
  }
}

describe(`isAssignable`, () => {

  describe(`simple cases`, () => {
    const project = new Project({
      compilerOptions: {
        strict: true,
      },
    })
    const klass = loadClassFromFile('01.ts')('TestClass01', project)

    describe(`using types`, () => {
      it(`says that "number" is assignable to "number"`, () => {
        const {dst, src} = getTypes(klass, 'p1', 'p1')
        expect(isAssignable(project, dst, src).ok).toBe(true)
      })
      it(`says that "string" is NOT assignable to "number"`, () => {
        const {dst, src} = getTypes(klass, 'p1', 'p2')
        const result = isAssignable(project, dst, src) as { ok: boolean, error: string }
        expect(result.ok).toBe(false)
        expect(result.error).toBe(`Type 'string' is not assignable to type 'number'.`)
      })
      it(`says that "number" is assignable to "number | string"`, () => {
        const {dst, src} = getTypes(klass, 'p3', 'p1')
        expect(isAssignable(project, dst, src).ok).toBe(true)
      })
      it(`says that "number | string" is assignable to "string | number"`, () => {
        const {dst, src} = getTypes(klass, 'p3b', 'p3')
        expect(isAssignable(project, dst, src).ok).toBe(true)
      })
      it(`says that "number | null" is NOT assignable to "number"`, () => {
        const {dst, src} = getTypes(klass, 'p1', 'p4')
        const result = isAssignable(project, dst, src) as { ok: boolean, error: string }
        expect(result.ok).toBe(false)
        expect(result.error).toBe(stripIndent`
          Type 'number | null' is not assignable to type 'number'.
            Type 'null' is not assignable to type 'number'.
        `)
      })
    })

    describe(`using strings`, () => {
      it(`says that "number" is assignable to "number"`, () => {
        expect(isAssignable(project, 'number', 'number').ok).toBe(true)
      })
      it(`says that "string" is NOT assignable to "number"`, () => {
        const result = isAssignable(project, 'number', 'string') as { ok: boolean, error: string }
        expect(result.ok).toBe(false)
        expect(result.error).toBe(`Type 'string' is not assignable to type 'number'.`)
      })
      it(`says that "number" is assignable to "number | string"`, () => {
        expect(isAssignable(project, 'number | string', 'number').ok).toBe(true)
      })
      it(`says that "number | string" is assignable to "string | number"`, () => {
        expect(isAssignable(project, 'string | number', 'number | string').ok).toBe(true)
      })
      it(`says that "number | null" is NOT assignable to "number"`, () => {
        const result = isAssignable(project, 'number', 'number | null') as { ok: boolean, error: string }
        expect(result.ok).toBe(false)
        expect(result.error).toBe(stripIndent`
          Type 'number | null' is not assignable to type 'number'.
            Type 'null' is not assignable to type 'number'.
        `)
      })
    })

  })

  describe(`complex types`, () => {
    const project = new Project({
      compilerOptions: {
        strict: true,
      },
    })
    const klass = loadClassFromFile('01.ts')('CrazyTypes', project)
    it(`says that User is assignable to User`, () => {
      const {dst, src} = getTypes(klass, 'p1', 'p1')
      expect(isAssignable(project, dst, src).ok).toBe(true)
    })
    it(`says that User is NOT assignable to UserFakeExtended`, () => {
      const {dst, src} = getTypes(klass, 'p2', 'p1')
      const result = isAssignable(project, dst, src) as {ok: false, error: string}
      expect(result.ok).toBe(false)
      expect(result.error).toBe(stripIndent`
        Type 'User' is not assignable to type 'UserFakeExtended'.
          Property 'details' is missing in type 'User'.
      `)
    })
  })

})

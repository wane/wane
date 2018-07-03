import Project, { ClassDeclaration } from 'ts-simple-ast'
import * as path from 'path'
import { canPropBeModified, getMethodsCalledFrom, getPropsWhichCanBeModifiedBy } from '../index'

const loadClassFromFile = (filename: string) => (className: string): ClassDeclaration => {
  const dir = path.join(__dirname.replace(`/dist/`, `/src/`), 'files')
  const file = path.join(dir, filename)
  const project = new Project()
  project.addExistingSourceFile(file)
  const source = project.getSourceFile(file)!
  return source.getClassOrThrow(className)
}

describe(`Analyzer Utils`, () => {
  const loadClass = loadClassFromFile(`01.ts`)

  describe(`getMethodsCalledFrom`, () => {

    it(`should work for a basic case`, () => {
      const klass = loadClass(`TestClass01`)
      expect(getMethodsCalledFrom(klass, `m1`)).toEqual(new Set([`m2`, `m3`]))
      expect(getMethodsCalledFrom(klass, `m2`)).toEqual(new Set([`m3`]))
      expect(getMethodsCalledFrom(klass, `m3`)).toEqual(new Set())
    })

    it(`should work with direct recursion`, () => {
      const klass = loadClass(`TestClass02`)
      expect(getMethodsCalledFrom(klass, `m1`)).toEqual(new Set())
    })

    it(`should work with indirect recursion`, () => {
      const klass = loadClass(`TestClass03`)
      expect(getMethodsCalledFrom(klass, `m1`)).toEqual(new Set([`m2`, `m3`]))
      expect(getMethodsCalledFrom(klass, `m2`)).toEqual(new Set([`m3`, `m1`]))
      expect(getMethodsCalledFrom(klass, `m3`)).toEqual(new Set([`m1`, `m2`]))
    })

    it(`should work with a condition`, () => {
      const klass = loadClass(`TestClass04`)
      expect(getMethodsCalledFrom(klass, `m1`)).toEqual(new Set([`m2`, `m3`]))
      expect(getMethodsCalledFrom(klass, `m2`)).toEqual(new Set())
      expect(getMethodsCalledFrom(klass, `m3`)).toEqual(new Set())
    })

    it(`should not be fooled by a non-method call`, () => {
      const klass = loadClass(`TestClass05`)
      expect(getMethodsCalledFrom(klass, `m1`)).toEqual(new Set())
    })

    it(`should work with a random more complex case`, () => {
      const klass = loadClass(`TestClass06`)
      const getCalls = getMethodsCalledFrom.bind(null, klass)
      expect(getCalls(`m1`)).toEqual(new Set([`m2`, `m5`, `m3`, `m4`, `m6`]), `m1`)
      expect(getCalls(`m2`)).toEqual(new Set([`m3`, `m4`, `m6`]), `m2`)
      expect(getCalls(`m3`)).toEqual(new Set(), `m3`)
      expect(getCalls(`m4`)).toEqual(new Set([`m3`]), `m4`)
      expect(getCalls(`m5`)).toEqual(new Set([`m2`, `m3`, `m4`, `m6`]), `m5`)
      expect(getCalls(`m6`)).toEqual(new Set([`m2`, `m3`, `m4`]), `m6`)
    })
  })

  describe(`getPropsWhichCanBeModifiedBy`, () => {

    it(`should work for a simple case`, () => {
      const klass = loadClass(`TestClass01`)
      expect(getPropsWhichCanBeModifiedBy(klass, `m1`)).toEqual(new Set([`p1`, `p2`, `p3`]))
      expect(getPropsWhichCanBeModifiedBy(klass, `m2`)).toEqual(new Set([`p2`, `p3`]))
      expect(getPropsWhichCanBeModifiedBy(klass, `m3`)).toEqual(new Set([`p3`]))
    })

    it(`should work for a randomly complex case`, () => {
      const klass = loadClass(`TestClass06`)
      const getProps = getPropsWhichCanBeModifiedBy.bind(null, klass)
      expect(getProps(`m1`)).toEqual(new Set([`p1`, `p3`]))
      expect(getProps(`m2`)).toEqual(new Set([`p1`, `p3`]))
      expect(getProps(`m3`)).toEqual(new Set([`p3`]))
      expect(getProps(`m4`)).toEqual(new Set([`p3`]))
      expect(getProps(`m5`)).toEqual(new Set([`p1`, `p3`]))
      expect(getProps(`m6`)).toEqual(new Set([`p1`, `p3`]))
    })

    it(`should recognize correct things as updates`, () => {
      const klass = loadClass(`TestClass07`)
      const getProps = getPropsWhichCanBeModifiedBy.bind(null, klass)
      expect(getProps(`m1`)).toEqual(new Set([`p`]))
      expect(getProps(`m2`)).toEqual(new Set([]))
      expect(getProps(`m3`)).toEqual(new Set([]))
      expect(getProps(`m4`)).toEqual(new Set([`p1`, `p2`, `p3`, `p4`]))
      // expect(getProps(`m5`)).toEqual(new Set([`p1`, `p2`]))
      expect(getProps(`m6`)).toEqual(new Set([]))
      expect(getProps(`m7`)).toEqual(new Set([]))
      // expect(getProps(`m8`)).toEqual(new Set([`p1`]))
      // expect(getProps(`m9`)).toEqual(new Set([`p1`, `p2`, `p3`]))
      // expect(getProps(`m10`)).toEqual(new Set([`p2`]))
    })

  })

  describe(`canPropBeModified`, () => {

    it(`should work`, () => {
      const klass1 = loadClass('TestClass01')
      expect(canPropBeModified(klass1, 'p1')).toBe(true)
      expect(canPropBeModified(klass1, 'p2')).toBe(true)
      expect(canPropBeModified(klass1, 'p3')).toBe(true)
      expect(canPropBeModified(klass1, 'p4')).toBe(false)

      const klass6 = loadClass('TestClass06')
      expect(canPropBeModified(klass6, 'p1')).toBe(true)
      expect(canPropBeModified(klass6, 'p2')).toBe(false)
      expect(canPropBeModified(klass6, 'p3')).toBe(true)
    })

  })

})

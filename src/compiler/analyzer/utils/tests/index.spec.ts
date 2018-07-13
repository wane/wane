import Project, { ClassDeclaration } from 'ts-simple-ast'
import * as path from 'path'
import {
  canPropBeModifiedInClass,
  getMethodBody,
  getMethodNamesCalledFrom,
  getPropNamesWhichCanBeModifiedBy
} from '../index'

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
      expect(getMethodNamesCalledFrom(getMethodBody(klass, `m1`))).toEqual(new Set([`m2`, `m3`]))
      expect(getMethodNamesCalledFrom(getMethodBody(klass, `m2`))).toEqual(new Set([`m3`]))
      expect(getMethodNamesCalledFrom(getMethodBody(klass, `m3`))).toEqual(new Set())
    })

    it(`should work with direct recursion`, () => {
      const klass = loadClass(`TestClass02`)
      expect(getMethodNamesCalledFrom(getMethodBody(klass, `m1`))).toEqual(new Set())
    })

    it(`should work with indirect recursion`, () => {
      const klass = loadClass(`TestClass03`)
      expect(getMethodNamesCalledFrom(getMethodBody(klass, `m1`))).toEqual(new Set([`m2`, `m3`]))
      expect(getMethodNamesCalledFrom(getMethodBody(klass, `m2`))).toEqual(new Set([`m3`, `m1`]))
      expect(getMethodNamesCalledFrom(getMethodBody(klass, `m3`))).toEqual(new Set([`m1`, `m2`]))
    })

    it(`should work with a condition`, () => {
      const klass = loadClass(`TestClass04`)
      expect(getMethodNamesCalledFrom(getMethodBody(klass, `m1`))).toEqual(new Set([`m2`, `m3`]))
      expect(getMethodNamesCalledFrom(getMethodBody(klass, `m2`))).toEqual(new Set())
      expect(getMethodNamesCalledFrom(getMethodBody(klass, `m3`))).toEqual(new Set())
    })

    it(`should not be fooled by a non-method call`, () => {
      const klass = loadClass(`TestClass05`)
      expect(getMethodNamesCalledFrom(getMethodBody(klass, `m1`))).toEqual(new Set())
    })

    it(`should work with a random more complex case`, () => {
      const klass = loadClass(`TestClass06`)
      const getCalls = (propName: string) => {
        return getMethodNamesCalledFrom(getMethodBody(klass, propName))
      }
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
      expect(getPropNamesWhichCanBeModifiedBy(getMethodBody(klass, `m1`))).toEqual(new Set([`p1`, `p2`, `p3`]))
      expect(getPropNamesWhichCanBeModifiedBy(getMethodBody(klass, `m2`))).toEqual(new Set([`p2`, `p3`]))
      expect(getPropNamesWhichCanBeModifiedBy(getMethodBody(klass, `m3`))).toEqual(new Set([`p3`]))
    })

    it(`should work for a randomly complex case`, () => {
      const klass = loadClass(`TestClass06`)
      const getProps = (methodName: string) => {
        return getPropNamesWhichCanBeModifiedBy(getMethodBody(klass, methodName))
      }
      expect(getProps(`m1`)).toEqual(new Set([`p1`, `p3`]))
      expect(getProps(`m2`)).toEqual(new Set([`p1`, `p3`]))
      expect(getProps(`m3`)).toEqual(new Set([`p3`]))
      expect(getProps(`m4`)).toEqual(new Set([`p3`]))
      expect(getProps(`m5`)).toEqual(new Set([`p1`, `p3`]))
      expect(getProps(`m6`)).toEqual(new Set([`p1`, `p3`]))
    })

    it(`should recognize correct things as updates`, () => {
      const klass = loadClass(`TestClass07`)
      const getProps = (methodName: string) => {
        return getPropNamesWhichCanBeModifiedBy(getMethodBody(klass, methodName))
      }
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
      expect(canPropBeModifiedInClass('p1', klass1)).toBe(true)
      expect(canPropBeModifiedInClass('p2', klass1)).toBe(true)
      expect(canPropBeModifiedInClass('p3', klass1)).toBe(true)
      expect(canPropBeModifiedInClass('p4', klass1)).toBe(false)

      const klass6 = loadClass('TestClass06')
      expect(canPropBeModifiedInClass('p1', klass6)).toBe(true)
      expect(canPropBeModifiedInClass('p2', klass6)).toBe(false)
      expect(canPropBeModifiedInClass('p3', klass6)).toBe(true)
    })

  })

})

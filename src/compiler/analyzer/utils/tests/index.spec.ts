import Project, { Block, ClassDeclaration, SyntaxKind } from 'ts-simple-ast'
import * as path from 'path'
import {
  canPropBeModifiedInClass,
  getBodiesCalledFrom,
  getMethodBody,
  getPropNamesWhichCanBeModifiedBy,
  isMethodBody,
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

    const getTest = (klass: ClassDeclaration) => {
      return (methodName: string, methodNames: string[]) => {
        const actual = getBodiesCalledFrom(getMethodBody(klass, methodName))
        const expectedArr = klass.getMethods()
          .filter(method => methodNames.includes(method.getName()))
          .map(method => method.getFirstDescendantByKindOrThrow(SyntaxKind.Block))
        const expected = new Set(expectedArr)
        expect(actual).toEqual(expected, methodName)
      }
    }

    it(`should work for a basic case`, () => {
      const test = getTest(loadClass(`TestClass01`))
      test(`m1`, [`m2`, `m3`])
      test(`m2`, [`m3`])
      test(`m3`, [])
    })

    it(`should work with direct recursion`, () => {
      const test = getTest(loadClass(`TestClass02`))
      test(`m1`, [])
    })

    it(`should work with indirect recursion`, () => {
      const test = getTest(loadClass(`TestClass03`))
      test(`m1`, [`m2`, `m3`])
      test(`m2`, [`m3`, `m1`])
      test(`m3`, [`m1`, `m2`])
    })

    it(`should work with a condition`, () => {
      const test = getTest(loadClass(`TestClass04`))
      test(`m1`, [`m2`, `m3`])
      test(`m2`, [])
      test(`m3`, [])
    })

    it(`should not be fooled by a non-method call`, () => {
      const test = getTest(loadClass(`TestClass05`))
      test(`m1`, [])
    })

    it(`should work with a random more complex case`, () => {
      const test = getTest(loadClass(`TestClass06`))
      test(`m1`, [`m2`, `m5`, `m3`, `m4`, `m6`])
      test(`m2`, [`m3`, `m4`, `m6`])
      test(`m3`, [])
      test(`m4`, [`m3`])
      test(`m5`, [`m2`, `m3`, `m4`, `m6`])
      test(`m6`, [`m2`, `m3`, `m4`])
    })

    it(`is not stopped by a random block`, () => {
      const test = getTest(loadClass('TestClass08'))
      test('methodWithBlock', ['m3', 'm4'])
    })

    it(`is not stopped by a random callback`, () => {
      const test = getTest(loadClass('TestClass08'))
      test('methodWithCallback', ['m3', 'm4'])
    })
  })

  describe(`getPropsWhichCanBeModifiedBy`, () => {

    const getTest = (klass: ClassDeclaration) => {
      return (methodName: string, propNames: string[]) => {
        const actual = getPropNamesWhichCanBeModifiedBy(getMethodBody(klass, methodName))
        const expected = new Set(propNames)
        expect(actual).toEqual(expected, methodName)
      }
    }

    it(`should work for a simple case`, () => {
      const test = getTest(loadClass(`TestClass01`))
      test('m1', ['p1', 'p2', 'p3'])
      test('m2', ['p2', 'p3'])
      test('m3', ['p3'])
    })

    it(`should work for a randomly complex case`, () => {
      const test = getTest(loadClass(`TestClass06`))
      test(`m1`, [`p1`, `p3`])
      test(`m2`, [`p1`, `p3`])
      test(`m3`, [`p3`])
      test(`m4`, [`p3`])
      test(`m5`, [`p1`, `p3`])
      test(`m6`, [`p1`, `p3`])
    })

    it(`should recognize correct things as updates`, () => {
      const test = getTest(loadClass(`TestClass07`))
      test(`m1`, [`p`])
      test(`m2`, [])
      test(`m3`, [])
      test(`m4`, [`p1`, `p2`, `p3`, `p4`])
      // test(`m5`, [`p1`, `p2`])
      test(`m6`, [])
      test(`m7`, [])
      // test(`m8`, [`p1`])
      // test(`m9`, [`p1`, `p2`, `p3`])
      // test(`m10`, [`p2`])
      test(`m11`, [`p1`])
    })

    it(`is not stopped by a random block`, () => {
      const test = getTest(loadClass('TestClass08'))
      test('methodWithBlock', ['p1', 'p3', 'p2', 'p4'])
    })

    it(`is not stopped by a random callback`, () => {
      const test = getTest(loadClass('TestClass08'))
      test('methodWithCallback', ['p3', 'p4', 'p2'])
    })

  })

  describe(`canPropBeModified`, () => {

    const getTest = (klass: ClassDeclaration) => {
      return (propName: string, canBe: boolean) => {
        expect(canPropBeModifiedInClass(propName, klass)).toBe(canBe, propName)
      }
    }

    it(`should work`, () => {
      const test = getTest(loadClass('TestClass01'))
      test('p1', true)
      test('p2', true)
      test('p3', true)
      test('p4', false)
    })

    it(`should really work`, () => {
      const test = getTest(loadClass('TestClass06'))
      test('p1', true)
      test('p2', false)
      test('p3', true)
    })

  })

  describe(`isMethodBody`, () => {

    const getTest = (block: Block, result: boolean, name?: string) => {
      expect(isMethodBody(block)).toBe(result, name)
    }

    it(`should report true`, () => {
      const klass = loadClass('TestClass01')
      const m1Declaration = klass.getMethodOrThrow('m1')
      const m1Body = m1Declaration.getFirstChildByKindOrThrow(SyntaxKind.Block)
      getTest(m1Body, true)
    })

    it(`should report false when block is a random block`, () => {
      const klass = loadClass('TestClass08')
      const methodDeclaration = klass.getMethodOrThrow('methodWithBlock')
      const methodBody = methodDeclaration.getFirstChildByKindOrThrow(SyntaxKind.Block)
      const methodBodySyntaxList = methodBody.getFirstChildByKindOrThrow(SyntaxKind.SyntaxList)
      const block = methodBodySyntaxList.getFirstChildByKindOrThrow(SyntaxKind.Block)
      getTest(block, false)
    })

    it(`should report false when block is a named function inside a method`, () => {
      const klass = loadClass('TestClass08')
      const methodDeclaration = klass.getMethodOrThrow('methodWithCallback')
      const arrowFn = methodDeclaration.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction)
      const block = arrowFn.getFirstChildByKindOrThrow(SyntaxKind.Block)
      getTest(block, false)
    })

  })

})

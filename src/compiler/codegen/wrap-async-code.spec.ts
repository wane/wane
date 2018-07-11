import Project, { IndentationText, Scope, SourceFile, SyntaxKind } from "ts-simple-ast";
import { stripIndent } from "common-tags";
import {
  expandArrowFunction,
  expandCallback,
  injectCodeInExpandedFunction,
  injectConstructorParam,
  wrapAsyncCode,
} from "./wrap-async-code";

export function createProjectFromString (fileContent: string): {
  project: Project,
  sourceFile: SourceFile,
} {
  const project = new Project({
    useVirtualFileSystem: true,
    manipulationSettings: { indentationText: IndentationText.TwoSpaces },
  })
  const sourceFile = project.createSourceFile('__temp__.ts', fileContent)
  return { project, sourceFile }
}

describe(`wrap-async-code`, () => {

  describe(`expandArrowFunction`, () => {

    it(`ignores arrow function if it already has body`, () => {
      const code = `const arrowFn = () => { return 42 }`
      const { sourceFile } = createProjectFromString(code)
      const arrowFunction = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction)
      expandArrowFunction(arrowFunction)
      expect(sourceFile.getFullText()).toBe(code)
    })

    it(`expands arrow function without body`, () => {
      const code = `const arrowFn = () => 42`
      const { sourceFile } = createProjectFromString(code)
      const arrowFunction = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction)
      expandArrowFunction(arrowFunction)
      const expected = stripIndent`
        const arrowFn = () => {
          return 42
        }
      `
      expect(sourceFile.getFullText()).toBe(expected)
    })

    it(`does not get tricked by returning an object literal`, () => {
      const code = `const arrowFn = () => ({ life: 42 })`
      const { sourceFile } = createProjectFromString(code)
      const arrowFunction = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction)
      expandArrowFunction(arrowFunction)
      const expected = stripIndent`
        const arrowFn = () => {
          return { life: 42 }
        }
      `
      expect(sourceFile.getFullText()).toBe(expected)
    })

  })


  describe(`expandCallback`, () => {

    it(`does nothing when it's already expanded as arrow function`, () => {
      const code = `callback(() => { return 42 })`
      const { sourceFile } = createProjectFromString(code)
      const callExpression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.CallExpression)
      const syntaxList = callExpression.getFirstDescendantByKindOrThrow(SyntaxKind.SyntaxList)
      expandCallback(syntaxList)
      expect(sourceFile.getFullText()).toBe(code)
    })

    it(`does nothing when it's already expanded as a function`, () => {
      const code = `callback(function () { return 42 })`
      const { sourceFile } = createProjectFromString(code)
      const callExpression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.CallExpression)
      const syntaxList = callExpression.getFirstDescendantByKindOrThrow(SyntaxKind.SyntaxList)
      expandCallback(syntaxList)
      expect(sourceFile.getFullText()).toBe(code)
    })

    it(`expands a function reference`, () => {
      const code = `callback(handler)`
      const { sourceFile } = createProjectFromString(code)
      const callExpression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.CallExpression)
      const syntaxList = callExpression.getFirstDescendantByKindOrThrow(SyntaxKind.SyntaxList)
      expandCallback(syntaxList)
      const expected = stripIndent`
        callback((...args: any[]) => {
          return handler(...args)
        })
      `
      expect(sourceFile.getFullText()).toBe(expected)
    })

    it(`expands a rebound function reference`, () => {
      const code = `callback(this.handler.bind(this))`
      const { sourceFile } = createProjectFromString(code)
      const callExpression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.CallExpression)
      const syntaxList = callExpression.getFirstDescendantByKindOrThrow(SyntaxKind.SyntaxList)
      expandCallback(syntaxList)
      const expected = stripIndent`
        callback((...args: any[]) => {
          return this.handler.bind(this)(...args)
        })
      `
      expect(sourceFile.getFullText()).toBe(expected)
    })

    it(`expands a shorthand for arrow function`, () => {
      const code = `callback(() => 42)`
      const { sourceFile } = createProjectFromString(code)
      const callExpression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.CallExpression)
      const syntaxList = callExpression.getFirstDescendantByKindOrThrow(SyntaxKind.SyntaxList)
      expandCallback(syntaxList)
      const expected = stripIndent`
        callback(() => {
          return 42
        })
      `
      expect(sourceFile.getFullText()).toBe(expected)
    })

  })


  describe(`injectCodeInExpandedFunction`, () => {

    it(`injects code in arrow function`, () => {
      const code = stripIndent`
        callback(() => {
          return 42
        })
      `
      const { sourceFile } = createProjectFromString(code)
      const callExpression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.CallExpression)
      const syntaxList = callExpression.getFirstDescendantByKindOrThrow(SyntaxKind.SyntaxList)
      injectCodeInExpandedFunction(syntaxList, w => {
        w.writeLine(`// injected`)
        return true
      })
      const expected = stripIndent`
        callback((...args: any[]) => {
          const __wane__result = (() => {
            return 42
          })(...args)
          // injected
          return __wane__result
        })
      `
      expect(sourceFile.getFullText()).toBe(expected)
    })

    it(`injects code in a function`, () => {
      const code = stripIndent`
        callback(function named () {
          return 42
        })
      `
      const { sourceFile } = createProjectFromString(code)
      const callExpression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.CallExpression)
      const syntaxList = callExpression.getFirstDescendantByKindOrThrow(SyntaxKind.SyntaxList)
      injectCodeInExpandedFunction(syntaxList, w => {
        w.writeLine(`// injected`)
        return true
      })
      const expected = stripIndent`
        callback((...args: any[]) => {
          const __wane__result = (function named () {
            return 42
          })(...args)
          // injected
          return __wane__result
        })
      `
      expect(sourceFile.getFullText()).toBe(expected)
    })

  })


  describe(`injectConstructorParam`, () => {

    it(`works when there is no constructor`, () => {
      const code = stripIndent`
        class Klass {
          prop1 = 1
        }
      `
      const { sourceFile } = createProjectFromString(code)
      const classDeclaration = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration)
      injectConstructorParam(classDeclaration, Scope.Private, '__wane__factory', 'any')
      const expected = stripIndent`
        class Klass {
          prop1 = 1

          constructor(private __wane__factory: any) {
          }
        }
      `
      expect(sourceFile.getFullText()).toBe(expected)
    })

    it(`works when there is an empty constructor`, () => {
      const code = stripIndent`
        class Klass {
          constructor () { }
        }
      `
      const { sourceFile } = createProjectFromString(code)
      const classDeclaration = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration)
      injectConstructorParam(classDeclaration, Scope.Private, '__wane__factory', 'any')
      const expected = stripIndent`
        class Klass {
          constructor (private __wane__factory: any) { }
        }
      `
      expect(sourceFile.getFullText()).toBe(expected)
    })

    it(`works whn there is a constructor with arguments`, () => {
      const code = stripIndent`
        class Klass {
          constructor (foo: Foo, bar: Bar) { }
        }
      `
      const { sourceFile } = createProjectFromString(code)
      const classDeclaration = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration)
      injectConstructorParam(classDeclaration, Scope.Private, '__wane__factory', 'any')
      const expected = stripIndent`
        class Klass {
          constructor (foo: Foo, bar: Bar, private __wane__factory: any) { }
        }
      `
      expect(sourceFile.getFullText()).toBe(expected)
    })

  })


  describe(`wrapAsyncCode`, () => {

    function testTransform (before: string, after: string) {
      const { sourceFile } = createProjectFromString(before)
      sourceFile.getClasses().forEach(klass => {
        wrapAsyncCode(klass, () => writer => {
          writer.writeLine(`// inject`)
          return true
        })
      })
      expect(sourceFile.getFullText()).toBe(after)
    }

    it(`does nothing when there are no promises in code`, () => {
      const before = stripIndent`
        export class Foo {
          p1 = 1
          then () {
            this.p1 = 11
          }
        }
      `
      testTransform(before, before)
    })

    it(`injects constructor and wraps callbacks`, () => {
      const before = stripIndent`
        export class Foo {
          m1 () { }
          m2 () {
            fetchData().then(data => {
              this.m1()
            })
          }
        }
      `
      const after = stripIndent`
        export class Foo {
          m1 () { }
          m2 () {
            fetchData().then((...args: any[]) => {
          const __wane__result = (data => {
                this.m1()
              })(...args)
          // inject
          return __wane__result
        })
          }

          constructor(private __wane__factory: any) {
          }
        }
      `
      testTransform(before, after)
    })

    it(`injects a param into constructor and wraps callbacks`, () => {
      const before = stripIndent`
        export class Foo {
          constructor (existing: any) {
            // code
          }
          m1 () { }
          m2 () {
            fetchData().then(data => {
              this.m1()
            })
          }
        }
      `
      const after = stripIndent`
        export class Foo {
          constructor (existing: any, private __wane__factory: any) {
            // code
          }
          m1 () { }
          m2 () {
            fetchData().then((...args: any[]) => {
          const __wane__result = (data => {
                this.m1()
              })(...args)
          // inject
          return __wane__result
        })
          }
        }
      `
      testTransform(before, after)
    })

  })

})

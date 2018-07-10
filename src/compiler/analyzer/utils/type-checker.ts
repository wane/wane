/**
 * Since TS API does not expose an "is assignable to" method and
 * doesn't let us create types from thin air, we'll need to use a workaround.
 *
 * We create a file where we write a simple assignment from type A to type B.
 * If the file compiles with no errors, that's assignable. Otherwise, it is not.
 *
 * @example
 *
 * It prints a file like this to check for:
 *   dst: number | string | { foo: number }
 *   src: { foo: null }
 *
 * ```
 * let a: number | string | { foo: number } = 0 as any as { foo: null }
 * ```
 *
 * Since this returns a type error when compiled, the function returns null.
 */
import {default as Project, DiagnosticMessageChain, Type} from 'ts-simple-ast'
import {fill} from '../../utils/tree'

function toString (type: string | Type): string {
  if (typeof type == 'string') {
    return type
  } else {
    return type.getText()
  }
}

const FILENAME = '__a_stupid_way_to_type_check__.ts'

type AssignableReport = {
  ok: true
} | {
  ok: false
  error: string
}

/**
 * TypeScript errors are in a form of linked list, where the reason for the error
 * can be taken by reading the "getNext()" method. Here we walk until the end of
 * this chain and keep stacking the errors in a readable manner, by indenting each
 * reason by two more spaces.
 * @param arg
 */
function prettyPrintError (arg: string | DiagnosticMessageChain): string {
  if (typeof arg == 'string') {
    return arg
  }

  let result: string = ``
  let indentLevel: number = 0
  let current: DiagnosticMessageChain | undefined = arg
  while (current != null) {
    const currentMessage: string = current.getMessageText()
    const indent = fill(indentLevel)
    result += `${indent}${currentMessage}\n`
    current = current.getNext()
    indentLevel += 2
  }
  return result.slice(0, -1) // removing the last newline
}

export function isAssignable (project: Project, dst: string | Type, src: string | Type): AssignableReport {
  const dstType = toString(dst)
  const srcType = toString(src)

  const content = `const a: ${dstType} = 0 as any as ${srcType}`
  const file = project.createSourceFile(FILENAME, content)
  const diagnostics = file.getDiagnostics()
  file.delete()

  const ok = diagnostics.length == 0

  if (ok) {
    return {ok}
  } else {
    const errorOrErrorChain = diagnostics[0].getMessageText()
    const error = prettyPrintError(errorOrErrorChain)
    return {ok, error}
  }
}

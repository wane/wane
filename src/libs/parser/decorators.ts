import { Eps } from './eps'
import { Rule } from './rules'

export type LhsSymbol = NonTerminalCtor
export type RhsSymbol = NonTerminalCtor | TerminalCtor | Eps

export type Lhs = LhsSymbol
export type Rhs = Array<RhsSymbol>

export interface Terminal {
  __terminal__: true // fake
}

export interface NonTerminal {
  __non_terminal__: true
}

export interface TerminalCtor extends Function {
  new (): Terminal

  __terminal_constructor__: true // fake
}

export interface NonTerminalCtor extends Function {
  new (): Terminal
  __non_terminal_constructor__: true
  __rules__: Array<Rule>
}

export type Ctor<T> = T extends Terminal
  ? TerminalCtor
  : T extends NonTerminal
    ? NonTerminalCtor
    : new (...args: any[]) => T

export function getCtor<T> (t: T): Ctor<T> {
  return t.constructor as Ctor<T>
}

export function isNonTerminalCtor (something: unknown): something is NonTerminalCtor {
  return (something as any).__non_terminal_constructor__ === true
}

export const rule = (rhsFn: () => Array<Function | Eps>) => {
  const decorator: MethodDecorator = (target: any, propertyKey, descriptor) => {
    if (target.prototype == undefined) {
      throw new Error(`The @rule decorator must be placed on a static method. Class: ${target.name}; method: ${String(propertyKey)}`)
    }
    target.prototype.__non_terminal__ = true
    target.toString = () => target.name

    target.__non_terminal_constructor__ = true
    const newRule = new Rule(target, rhsFn as any, propertyKey as string)
    if (!target.hasOwnProperty('__rules__')) {
      target.__rules__ = []
    }
    target.__rules__.push(newRule)
  }
  return decorator
}

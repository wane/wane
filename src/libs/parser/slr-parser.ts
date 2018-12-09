import { Grammar } from './grammar'
import { Rule } from './rules'
import { Eps, isEps } from './eps'
import { eof, Eof, isEof } from './eof'
import { Stack } from '../stack'
import {
  getCtor,
  isNonTerminalCtor,
  NonTerminal,
  NonTerminalCtor,
  RhsSymbol,
  rule,
  Terminal,
  TerminalCtor,
} from './decorators'

enum LrActionType {
  Shift,
  Reduce,
  Accept,
  Error,
}

interface LrShiftAction {
  type: LrActionType.Shift
  setIndex: number
}

interface LrReduceAction {
  type: LrActionType.Reduce
  rule: Rule
}

interface LrAcceptAction {
  type: LrActionType.Accept
}

interface LrErrorAction {
  type: LrActionType.Error
}

type LrAction = LrShiftAction | LrReduceAction | LrAcceptAction | LrErrorAction


function printAction (action: LrAction): string {
  switch (action.type) {
    case LrActionType.Shift:
      return `sh[${ action.setIndex }]`
    case LrActionType.Reduce:
      return `rd[${ action.rule }]`
    case LrActionType.Accept:
      return `acc`
    case LrActionType.Error:
      return `err`
  }
}

export class LrSyntaxTable {

  private actions = new Map<TerminalCtor | Eof, Map<number, LrAction>>()
  private gotos = new Map<NonTerminalCtor, Map<number, number>>()

  public constructor (private terminals: Iterable<TerminalCtor>,
                      private nonTerminals: Iterable<NonTerminalCtor>) {
  }

  public addAction (terminal: TerminalCtor | Eof, sourceSetIndex: number, action: LrAction): this {
    if (!this.actions.has(terminal)) {
      this.actions.set(terminal, new Map())
    }

    const terminalRow = this.actions.get(terminal)!
    if (terminalRow.has(sourceSetIndex)) {
      throw new Error(`An action already exists for ${ (terminal as any).name } and set ${ sourceSetIndex }: ${ printAction(terminalRow.get(sourceSetIndex)!) }. Cannot add ${ printAction(action) }`)
    }

    terminalRow.set(sourceSetIndex, action)
    return this
  }

  public addGoto (nonTerminal: NonTerminalCtor, sourceSetIndex: number, destinationSetIndex: number): this {
    if (!this.gotos.has(nonTerminal)) {
      this.gotos.set(nonTerminal, new Map())
    }

    const nonTerminalRow = this.gotos.get(nonTerminal)!
    if (nonTerminalRow.has(sourceSetIndex)) {
      throw new Error(`A goto already exists for ${ nonTerminal.name } and set ${ sourceSetIndex }: ${ nonTerminalRow.get(sourceSetIndex)! }`)
    }

    nonTerminalRow.set(sourceSetIndex, destinationSetIndex)
    return this
  }

  public getAction (terminal: TerminalCtor | Eof, source: number): LrAction {
    const row = this.actions.get(terminal)
    if (row == null) {
      this.print()
      throw new Error(`No entry in Action Table for terminal ${ terminal }.`)
    }
    const fromMap = row.get(source)
    return fromMap == null ? { type: LrActionType.Error } : fromMap
  }

  public getGoto (nonTerminal: NonTerminalCtor, source: number): number | undefined {
    const fromMap = this.gotos.get(nonTerminal)!.get(source)
    return fromMap == null ? undefined : fromMap
  }

  public print () {
    const row: string[] = []
    for (const [terminalOrEpsOrEof, map] of this.actions) {
      for (const [index, action] of map) {
        const name = isEps(terminalOrEpsOrEof)
          ? terminalOrEpsOrEof.toString()
          : isEof(terminalOrEpsOrEof)
            ? terminalOrEpsOrEof.toString()
            : terminalOrEpsOrEof.name
        row.push(`${ name.padEnd(30) } ${ index.toString().padStart(5) } => ${ printAction(action) }`)
      }
    }
    for (const [nonTerminal, map] of this.gotos) {
      for (const [src, dst] of map) {
        row.push(`${ nonTerminal.toString().padEnd(30) } ${ src.toString().padStart(5) } => ${ dst }`)
      }
    }
    return row.join('\n')
  }

}

interface DottedRule {
  dotIndex: number
  rule: Rule
}

function getDottedSymbol (dottedRule: DottedRule): TerminalCtor | NonTerminalCtor | Eps | null {
  return dottedRule.rule.rhs()[dottedRule.dotIndex] || null
}

function printDottedRule (dottedRule: DottedRule): string {
  const { lhs, rhs: rhsArray } = dottedRule.rule
  let addedDot = false
  const rhs = rhsArray().map((item, index) => {
    let string = ''
    if (index == dottedRule.dotIndex) {
      string += '\u2022 '
      addedDot = true
    }
    string += typeof item == 'function' ? item.name : item
    return string
  }).join(' ')
  return addedDot
    ? `${ lhs } -> ${ rhs }`
    : `${ lhs } -> ${ rhs } \u2022`
}

function areEqDottedRules (a: DottedRule, b: DottedRule) {
  return a.dotIndex == b.dotIndex && a.rule == b.rule
}

function areArraysOfDottedRulesEqualInAnyOrder (as: Array<DottedRule>,
                                                bs: Array<DottedRule>): boolean {
  for (const a of as) {
    if (!bs.some(b => areEqDottedRules(a, b))) return false
  }
  for (const b of bs) {
    if (!as.some(a => areEqDottedRules(a, b))) return false
  }
  return true
}

function generateSet (grammar: Grammar,
                      dottedRules: Array<DottedRule>): Array<DottedRule> {
  const result: Array<DottedRule> = [...dottedRules]
  const checkedNonTerminals = new Set<NonTerminalCtor | Eps>()
  let currentIndex = 0

  while (currentIndex < result.length) {
    const currentDottedRule = result[currentIndex]
    if (currentDottedRule != null) {
      const rhs = currentDottedRule.rule.rhs()
      const relevantNonTerminal = rhs[currentDottedRule.dotIndex]
      if (relevantNonTerminal != null && isNonTerminalCtor(relevantNonTerminal) && !checkedNonTerminals.has(relevantNonTerminal)) {
        checkedNonTerminals.add(relevantNonTerminal)
        const newRules = grammar.getRulesWithLhs(relevantNonTerminal)
        const relevantNewRules = newRules
          .map(rule => {
            return {
              rule,
              dotIndex: 0,
            }
          })
          .filter(newRule => {
            return result.every(dottedRule => !areEqDottedRules(dottedRule, newRule))
          })
        relevantNewRules.forEach(dottedRule => {
          result.push(dottedRule)
        })
      }
    }
    currentIndex++
  }

  return result
}


function getAllDottedRulesWithSameDottedSymbol (dottedRules: Array<DottedRule>,
                                                symbol: RhsSymbol): Array<DottedRule> {
  return dottedRules.filter(dottedRule => {
    const dottedSymbol = getDottedSymbol(dottedRule)
    return dottedSymbol == symbol
  })
}

function getPartitionsBySymbolAtDot (dottedRules: Array<DottedRule>): Map<RhsSymbol, Array<DottedRule>> {
  const partitions = new Map<RhsSymbol, Array<DottedRule>>()
  for (const dottedRule of dottedRules) {
    const dottedSymbol = getDottedSymbol(dottedRule)
    if (dottedSymbol != null && !partitions.has(dottedSymbol)) {
      partitions.set(dottedSymbol, getAllDottedRulesWithSameDottedSymbol(dottedRules, dottedSymbol))
    }
  }
  return partitions
}

interface Goto {
  sourceSetIndex: number
  destinationSetIndex: number
  symbol: RhsSymbol
}

function printGoto (goto: Goto) {
  const { sourceSetIndex, destinationSetIndex, symbol } = goto
  return `I${ destinationSetIndex } = goto(I${ sourceSetIndex }, ${ typeof symbol == 'function'
    ? symbol.name
    : symbol })`
}

export interface Logger<T> {
  add (t: T): this

  getAll (): T[]
}

export class DefaultLogger<T = any> implements Logger<T> {
  private logs: T[] = []

  public add (t: T): this {
    this.logs.push(t)
    return this
  }

  public getAll () {
    return this.logs
  }
}

export function generateTable (initialGrammar: Grammar): LrSyntaxTable {

  const Start = initialGrammar.getStartingNonTerminal()

  class PhantomStart {
    @rule(() => [Start])
    public static accept (data: typeof Start) {
      return new PhantomStart(data)
    }

    public constructor (private data: typeof Start) {
    }
  }

  const grammar = new Grammar(PhantomStart)

  const firstDottedRule: DottedRule = {
    dotIndex: 0,
    rule: (PhantomStart as unknown as NonTerminalCtor).__rules__[0],
  }

  const sets: Array<Array<DottedRule>> = []
  sets[0] = generateSet(grammar, [firstDottedRule])

  const gotos: Array<Goto> = []

  const unhandledSetsQueue: Array<number> = [0]

  while (unhandledSetsQueue.length > 0) {
    const setIndex = unhandledSetsQueue.shift()!
    const set = sets[setIndex]

    const partitions = getPartitionsBySymbolAtDot(set)
    for (const [symbol, subset] of partitions) {
      const advancedSubsetRules: Array<DottedRule> = subset.map(subsetRule => ({
        ...subsetRule,
        dotIndex: subsetRule.dotIndex + 1,
      }))
      const newSet = generateSet(grammar, advancedSubsetRules)
      const sameSetIndex = sets.findIndex(oldSet => {
        return areArraysOfDottedRulesEqualInAnyOrder(oldSet, newSet)
      })
      if (sameSetIndex == -1) {
        sets.push(newSet)
        const newIndex = sets.length - 1
        gotos.push({
          sourceSetIndex: setIndex,
          destinationSetIndex: newIndex,
          symbol,
        })
        unhandledSetsQueue.push(newIndex)
      } else {
        gotos.push({
          sourceSetIndex: setIndex,
          destinationSetIndex: sameSetIndex,
          symbol,
        })
      }
    }
  }

  // The dragon Book, Algorithm 4.46 on page 253
  const table = new LrSyntaxTable(grammar.getTerminals(), grammar.getNonTerminals())

  // 2. (a)
  for (const goto of gotos) {
    const setIndex = goto.sourceSetIndex
    const set = sets[setIndex]
    for (const dottedRule of set) {
      if (grammar.hasTerminal(goto.symbol) && getDottedSymbol(dottedRule) == goto.symbol) {
        const action: LrShiftAction = {
          type: LrActionType.Shift,
          setIndex: goto.destinationSetIndex,
        }
        table.addAction(goto.symbol, setIndex, action)
      }
    }

    // 3.
    if (isNonTerminalCtor(goto.symbol)) {
      table.addGoto(goto.symbol, goto.sourceSetIndex, goto.destinationSetIndex)
    }
  }

  for (let setIndex = 0; setIndex < sets.length; setIndex++) {
    const set = sets[setIndex]
    for (const dottedRule of set) {
      const dottedSymbol = getDottedSymbol(dottedRule)
      // 2. (b)
      if (dottedRule.rule.lhs != grammar.getStartingNonTerminal() && dottedSymbol == null) {
        const followSet = grammar.follow(dottedRule.rule.lhs)
        for (const terminal of followSet) {
          table.addAction(terminal, setIndex, {
            type: LrActionType.Reduce,
            rule: dottedRule.rule,
          })
        }
      }
      // 2. (c)
      if (dottedRule.rule.lhs == grammar.getStartingNonTerminal()) {
        if (dottedRule.rule.rhs().length == 1 && dottedRule.rule.rhs()[0] == Start) {
          if (dottedRule.dotIndex == 1) {
            table.addAction(eof, setIndex, {
              type: LrActionType.Accept,
            })
          }
        }
      }
    }
  }

  return table

}

class AstBuilder {

  private roots: Array<NonTerminal | Terminal> = []

  public shift (newItem: NonTerminal | Terminal) {
    this.roots.push(newItem)
  }

  public reduce (rule: Rule) {
    const acceptFunction = (rule.lhs as any)[rule.getAcceptingFunctionName()]
    const argsCount = rule.rhs().length
    const args = this.roots.splice(-argsCount, argsCount)
    console.assert(args.length == argsCount, `AstBuilder's stack unexpectedly short.`)
    const newNode = acceptFunction(...args)
    this.roots.push(newNode)
  }

  public getResult () {
    console.assert(this.roots.length == 1, `Expected AstBuilder to leave only a single root`)
    return this.roots[0]
  }

}

export class ShiftReduceTraceItem {
  private readonly stack: string
  private readonly input: string
  private readonly action: string

  constructor (stack: Stack<number | NonTerminalCtor | Terminal>,
               input: Array<Terminal>,
               action: LrAction) {
    this.stack = stack.toArray().join(' ').padEnd(80)
    this.input = input.join(' ').padEnd(80)
    this.action = printAction(action)
  }

  public toString () {
    return `${ this.stack }   ${ this.input }   ${ this.action }`
  }
}

export function doShiftReduce (terminals: Array<Terminal>,
                               table: LrSyntaxTable,
                               grammar: Grammar,
                               logger: Logger<ShiftReduceTraceItem> = new DefaultLogger<ShiftReduceTraceItem>()) {
  const astBuilder = new AstBuilder()
  const stack = new Stack<number | NonTerminalCtor | Terminal>()
  stack.push(0)
  let inputIndex = 0

  while (true) {
    const current = terminals[inputIndex] || eof
    const stackTop = stack.peek()
    if (typeof stackTop != 'number') throw new Error(`Expected top of stack to be a number.`)
    const action = table.getAction(isEof(current) ? eof : getCtor(current), stackTop) // todo: fix this stupid eof check
    switch (action.type) {
      case LrActionType.Shift: {
        logger.add(new ShiftReduceTraceItem(stack, terminals.slice(inputIndex), action))
        stack.push(current)
        stack.push(action.setIndex)
        inputIndex++
        astBuilder.shift(current)
        break
      }
      case LrActionType.Reduce: {
        logger.add(new ShiftReduceTraceItem(stack, terminals.slice(inputIndex), action))
        const rhsLength = action.rule.rhs().length
        stack.pop(2 * rhsLength)
        const currentStackTop = stack.peek()
        if (typeof currentStackTop != 'number') throw new Error(`Expected top of stack to be a number.`)
        stack.push(action.rule.lhs)
        stack.push(table.getGoto(action.rule.lhs, currentStackTop)!)
        astBuilder.reduce(action.rule)
        break
      }
      case LrActionType.Accept:
        logger.add(new ShiftReduceTraceItem(stack, terminals.slice(inputIndex), action))
        return astBuilder.getResult()
      case LrActionType.Error:
        logger.add(new ShiftReduceTraceItem(stack, terminals.slice(inputIndex), action))
        console.error(`============================================================`)
        console.error(grammar.printAllRules())
        console.error(`------------------------------------------------------------`)
        console.error(`NON-TERMINALS`)
        console.error([...grammar.getNonTerminals()].join('\n'))
        console.error(`------------------------------------------------------------`)
        console.error(`TERMINALS`)
        console.error([...grammar.getTerminals()].join('\n'))
        console.error(`------------------------------------------------------------`)
        console.error(`FIRSTS`)
        console.error(grammar.printFirst())
        console.error(`------------------------------------------------------------`)
        console.error(`FOLLOWS`)
        console.error(grammar.printFollow())
        console.error(`------------------------------------------------------------`)
        console.error(table.print())
        console.error(`------------------------------------------------------------`)
        console.error(logger.getAll().join('\n'))
        console.error(`============================================================`)
        throw new Error(`Could not parse.`)
    }
  }
}

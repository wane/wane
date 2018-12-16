import { Grammar } from './grammar'
import { Rule } from './rules'
import { Eps, isEps } from './eps'
import { eof, Eof, isEof } from './eof'
import { Stack, Queue } from '../stack'
import {
  getCtor,
  isNonTerminalCtor,
  NonTerminal,
  NonTerminalCtor,
  Terminal,
  TerminalCtor,
  NonEpsRhsSymbol,
} from './decorators'
import { areArraysEqualInAnyOrder } from './helpers'
import { Table } from '../boxed-table/table'
import { stripIndent } from 'common-tags'

// import { sub } from '../unicode-sub-sup'

function sub (c: string | number): string { return c.toString() }


enum LrActionType {
  Shift,
  Reduce,
  Accept,
  Error,
}

interface LrShiftAction {
  type: LrActionType.Shift
  node: SlrNode
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
      return `s${ action.node }`
    case LrActionType.Reduce:
      return `r${ action.rule }`
    case LrActionType.Accept:
      return `acc`
    case LrActionType.Error:
      return `err`
  }
}

function equalActions (a: LrAction, b: LrAction): boolean {
  if (a.type == LrActionType.Error && b.type == LrActionType.Error) return true
  if (a.type == LrActionType.Accept && b.type == LrActionType.Accept) return true
  if (a.type == LrActionType.Shift && b.type == LrActionType.Shift) {
    return a.node == b.node
  }
  if (a.type == LrActionType.Reduce && b.type == LrActionType.Reduce) {
    return a.rule == b.rule
  }
  return false
}

/**
 * Formally, an LR(0) item.
 */
export class DottedRule {

  public static equal (a: DottedRule, b: DottedRule): boolean {
    return a.dotIndex == b.dotIndex && a.rule == b.rule
  }

  constructor (public rule: Rule,
               public dotIndex: number = 0) {
  }

  /**
   * @example
   * A --> • B C    // => B
   * A --> B • C    // => C
   * A --> B C •    // => null
   * A --> ‎• ε      // => null
   */
  public getDottedSymbol (): NonEpsRhsSymbol | null {
    const symbol = this.rule.rhs()[this.dotIndex] || null
    if (isEps(symbol)) return null
    return symbol
  }

  /**
   * @example
   * A --> • B C    // => false
   * A --> B • C    // => false
   * A --> B C •    // => true
   * A --> • ε      // => true
   */
  public isDotAtEnd (): boolean {
    return this.getDottedSymbol() == null
  }

  /**
   * Don't mutate (return a new object).
   *
   * @example
   * A --> • B C     // =>  A --> B • C
   * A --> B • C     // =>  A --> B C •
   * A --> B C •     // throws
   * A --> • ε       // throws
   */
  public getAdvanced (): DottedRule {
    if (this.isDotAtEnd()) throw new Error(`Cannot advance a rule with the dot at the end.`)
    return new DottedRule(this.rule, this.dotIndex + 1)
  }

  public getRule () {
    return this.rule
  }

  public toString (): string {
    if (this.rule.isEpsRule()) return `${ this.rule.lhs } -> •`

    const {lhs, rhs: rhsArray} = this.rule
    let addedDot = false
    const rhs = rhsArray().map((item, index) => {
      let string = ''
      if (index == this.dotIndex) {
        string += '\u2022 '
        addedDot = true
      }
      string += typeof item == 'function' ? item.name : item // TODO: ew
      return string
    }).join(' ')
    return addedDot
      ? `${ lhs } -> ${ rhs }`
      : `${ lhs } -> ${ rhs } \u2022`
  }

}

/**
 * Basically a set of dotted rules, with some utility methods.
 */
export class SlrNode {

  static equal (set1: SlrNode, set2: SlrNode) {
    return areArraysEqualInAnyOrder(set1.dottedRules, set2.dottedRules, DottedRule.equal)
  }

  private dottedRules: Array<DottedRule> = []

  constructor (public grammar: Grammar,
               dottedRules: Array<DottedRule> | SlrNode) {
    const array = Array.isArray(dottedRules) ? dottedRules : dottedRules.dottedRules
    for (const dottedRule of array) {
      this.dottedRules.push(dottedRule)
    }
  }

  /**
   * Given the following closure set,
   *
   * E' --> • E
   * E  --> • E + T
   * E  --> • I
   * I  --> • a ( E )
   * I  --> • a
   *
   * this function returns the following closure sets.
   *
   * First set:
   * E' --> • E
   * E  --> • E + T
   *
   * Second set:
   * E  --> • I
   *
   * Third set:
   * I  --> • a ( E )
   * I  --> • a
   *
   * If a reduction rule is encountered (where the dot is at the end), it's not
   * taken into account at all. For example,
   *
   * A --> • B
   * A --> C •
   *
   * is broken into:
   *
   * First (and only) set:
   * A -> • B
   */
  public getPartitionsBySymbolAtDot (): Map<NonEpsRhsSymbol, SlrNode> {
    const partitions = new Map<NonEpsRhsSymbol, SlrNode>()
    for (const dottedRule of this.dottedRules) {
      const dottedSymbol = dottedRule.getDottedSymbol()
      if (dottedSymbol != null && !partitions.has(dottedSymbol)) {
        const rulesWithThisDottedSymbol = this.dottedRules.filter(rule => rule.getDottedSymbol() == dottedSymbol)
        const partitionSet = new SlrNode(this.grammar, rulesWithThisDottedSymbol)
        partitions.set(dottedSymbol, partitionSet)
      }
    }
    return partitions
  }

  /**
   * Mutate.
   */
  public advanceAll (): this {
    this.dottedRules = this.dottedRules.map(rule => rule.getAdvanced())
    return this
  }

  /**
   * Mutate.
   *
   * In practice, this function starts from the phantom rule
   * or from the result of partitioning a closure set.
   *
   * For example, given this grammar...
   *
   * ```text
   * (1)  E' --> E
   * (2)  E  --> E + I
   * (3)  E  --> I
   * (4)  I  --> a ( E )
   * (5)  I  --> a
   * ```
   *
   * ...and this set of dotted rules...
   *
   * ```text
   * E' --> • E
   * ```
   *
   * ... we can construct the following closure set.
   *
   * ```text
   * (c1)  E' --> • E         The given dotted rules are always a part of the result.
   * (c2)  E  --> • E + I     Because of dotted rule (c1), based on production rule (2).
   * (c3)  E  --> • I                                                   ...and rule (3).
   *                          Now we should look at (c2) and add new dotted rules based on
   *                          (2) and (3) again, but we already have those as (c2) and (c3),
   *                          so we don't do it.
   * (c4)  I  --> • a ( E )   Because of dotted rule (c3), based on production rule (4).
   * (c5)  I  --> • a                                                   ...and rule (5).
   *                          In (c4) the dot is in front of terminal, so we don't do anything.
   *                          In (c5) the same thing.
   *                          We've reached the end, so we're done with construction.
   * ```
   */
  public expand (): this {
    // Look at JsDoc example and the discussion between (c3) and (c4).
    // When we added (c2) and (c3) because of (c1), we added non-terminal E
    // to this set. Then, when we wanted to construct new dotted rules
    // because of (c2), we look into the set and find E. This way we don't
    // end up looping forever.
    const checkedNonTerminals = new Set<NonTerminalCtor | Eps>()

    // We cannot use a regular for-of loop because we're iterating over
    // an array which we're pushing into the while time.
    let currentIndex = 0

    while (currentIndex < this.dottedRules.length) {
      const currentDottedRule = this.dottedRules[currentIndex]

      if (currentDottedRule != null) { // TODO: why this check?
        const dottedSymbol = currentDottedRule.getDottedSymbol()
        if (dottedSymbol != null && isNonTerminalCtor(dottedSymbol) && !checkedNonTerminals.has(dottedSymbol)) {
          checkedNonTerminals.add(dottedSymbol)
          this.grammar
            .getRulesWithLhs(dottedSymbol)
            .map(rule => new DottedRule(rule))
            .filter(newRule => this.dottedRules.every(existingRule => !DottedRule.equal(existingRule, newRule)))
            .forEach(dottedRule => this.dottedRules.push(dottedRule))
        }
      }
      currentIndex++
    }

    return this
  }

  public getReductionRules () {
    return this.dottedRules.filter(rule => rule.isDotAtEnd())
  }

  public isAcceptingState () {
    return this.getReductionRules().length > 0
  }

  public toString () {
    return this.dottedRules.join('\n')
  }

}


class SlrEdge {
  constructor (public from: SlrNode,
               public symbol: NonEpsRhsSymbol,
               public to: SlrNode) { }
}

export class SlrGraph {

  public readonly nodes: Array<SlrNode> = []
  public readonly edges: Array<SlrEdge> = []

  /**
   * Expected to be augmented.
   */
  private readonly grammar: Grammar

  constructor (augmentedGrammar: Grammar) {
    this.grammar = augmentedGrammar
    this.compute()
  }

  public getStartState () {
    return this.nodes[0]
  }

  public toString (): string {
    const blocks: string[] = []

    const firstBlock = `I${ sub(0) }\n${ this.getStartState() }`
    blocks.push(firstBlock)

    const known = new Set<SlrNode>()
    const queue = new Queue<SlrNode>()

    known.add(this.getStartState())
    queue.push(this.getStartState())

    while (queue.isNotEmpty()) {
      const current = queue.pop()
      const edges = this.edges.filter(edge => edge.from == current)
      for (const {from, to, symbol} of edges) {
        const fromIndex = this.nodes.indexOf(from)
        const toIndex = this.nodes.indexOf(to)

        const blockTitle = `I${ sub(toIndex) } = goto(I${ sub(fromIndex) }, ${ symbol })`
        if (known.has(to)) {
          blocks.push(blockTitle)
        } else {
          const block = `${ blockTitle }\n${ to }`
          blocks.push(block)
          queue.push(to)
          known.add(to)
        }
      }
    }

    return blocks.join('\n\n')
  }

  private getNode (closureSet: SlrNode) {
    return this.nodes.find(node => SlrNode.equal(node, closureSet))
  }

  private compute () {
    // Fill in the first first entry.
    const phantomRule = this.grammar.getStartingRule()
    const dottedPhantomRule = new DottedRule(phantomRule)
    const startNode = new SlrNode(this.grammar, [dottedPhantomRule]).expand()
    this.nodes.push(startNode)

    const queue = new Queue<SlrNode>()
    queue.push(startNode)

    while (queue.isNotEmpty()) {
      const currNode = queue.pop()
      const partitions = currNode.getPartitionsBySymbolAtDot()

      for (const [symbol, subset] of partitions) {
        const maybeNewNode = new SlrNode(this.grammar, subset)
        maybeNewNode.advanceAll()
        maybeNewNode.expand()

        const existingNode = this.getNode(maybeNewNode)
        if (existingNode == null) {
          // indeed new node
          this.nodes.push(maybeNewNode)
          this.edges.push(new SlrEdge(currNode, symbol, maybeNewNode))
          queue.push(maybeNewNode)
        } else {
          // existing node
          this.edges.push(new SlrEdge(currNode, symbol, existingNode))
        }
      }
    }
  }

}


export class SlrTable {

  public readonly graph: SlrGraph
  public readonly augmentedGrammar: Grammar

  private readonly actions = new Map<TerminalCtor | Eof, Map<SlrNode, LrAction>>()
  private readonly gotos = new Map<NonTerminalCtor, Map<SlrNode, SlrNode>>()

  constructor (private grammar: Grammar) {
    this.augmentedGrammar = grammar.getAugmentedGrammar()
    this.graph = new SlrGraph(this.augmentedGrammar)
    this.buildMaps()
  }

  public getAction (terminal: TerminalCtor | Eof, set: SlrNode): LrAction {
    const err: LrAction = {type: LrActionType.Error}
    const forTerminal = this.actions.get(terminal)
    if (forTerminal == null) return err
    return forTerminal.get(set) || err
  }

  public getGoto (nonTerminal: NonTerminalCtor, set: SlrNode): SlrNode | null {
    const forNonTerminal = this.gotos.get(nonTerminal)
    if (forNonTerminal == null) return null
    return forNonTerminal.get(set) || null
  }

  public getStartState () {
    return this.graph.getStartState()
  }

  public toString () {
    const table = new Table()

    const statesHeader = ['#']
    const actionsHeader = [...this.augmentedGrammar.getTerminals(), eof]
    const gotosHeader = this.augmentedGrammar.getNonTerminals()
      .filter(nonTerminal => nonTerminal != this.augmentedGrammar.getStartingNonTerminal())
    table.setHeadings([...statesHeader, ...actionsHeader, ...gotosHeader])

    for (let stateIndex = 0; stateIndex < this.graph.nodes.length; stateIndex++) {
      const state = this.graph.nodes[stateIndex]
      const row: string[] = [stateIndex.toString(10)]

      for (const actionHeader of actionsHeader) {
        const action = this.getAction(actionHeader, state)
        switch (action.type) {
          case LrActionType.Error:
            row.push('')
            break
          case LrActionType.Accept:
            row.push('acc')
            break
          case LrActionType.Shift:
            row.push(`s${ this.graph.nodes.indexOf(action.node) }`)
            break
          case LrActionType.Reduce:
            row.push(`r${ this.augmentedGrammar.getRules().indexOf(action.rule) }`)
            break
        }
      }

      for (const goto of gotosHeader) {
        const node = this.getGoto(goto, state)
        if (node == null) {
          row.push('')
        } else {
          const i = this.graph.nodes.indexOf(node)
          row.push(i.toString(10))
        }
      }

      table.addRow(row)
    }

    return table.toString()
  }

  private buildMaps () {
    for (const edge of this.graph.edges) {
      if (isNonTerminalCtor(edge.symbol)) {
        this.addGoto(edge.from, edge.symbol, edge.to)
      } else {
        this.addShiftAction(edge.from, edge.symbol, edge.to)
      }
    }
    for (const node of this.graph.nodes) {
      if (!node.isAcceptingState()) continue
      for (const dottedRule of node.getReductionRules()) {
        if (dottedRule.getRule() == this.augmentedGrammar.getStartingRule()) {
          this.addAcceptAction(node)
        } else {
          const follow = this.augmentedGrammar.follow(dottedRule.getRule().lhs)
          for (const symbol of follow) {
            this.addReduceAction(node, symbol, dottedRule.getRule())
          }
        }
      }
    }
  }

  private addShiftAction (from: SlrNode, symbol: TerminalCtor | Eof, to: SlrNode): void {
    const action: LrShiftAction = {
      type: LrActionType.Shift,
      node: to,
    }
    this.checkActionConflicts(from, symbol, action)
    this.actions.get(symbol)!.set(from, action)
  }

  private addReduceAction (from: SlrNode, symbol: TerminalCtor | Eof, rule: Rule): void {
    const action: LrReduceAction = {
      type: LrActionType.Reduce,
      rule,
    }
    this.checkActionConflicts(from, symbol, action)
    this.actions.get(symbol)!.set(from, action)
  }

  private addAcceptAction (from: SlrNode): void {
    const action: LrAcceptAction = {
      type: LrActionType.Accept,
    }
    this.checkActionConflicts(from, eof, action)
    this.actions.get(eof)!.set(from, action)
  }

  private addGoto (from: SlrNode, symbol: NonTerminalCtor, set: SlrNode): void {
    this.checkGotoConflicts(from, symbol)
    this.gotos.get(symbol)!.set(from, set)
  }

  private checkActionConflicts (from: SlrNode, symbol: TerminalCtor | Eof, newAction: LrAction) {
    if (!this.actions.has(symbol)) this.actions.set(symbol, new Map())
    const existingAction = this.actions.get(symbol)!.get(from)

    if (existingAction != null && !equalActions(existingAction, newAction)) {
      console.error(this.augmentedGrammar.toString())
      console.error(this.toString())
      console.error(stripIndent`
        Conflict at ${ this.graph.nodes.indexOf(from) }/${ symbol }.
        ${ printAction(existingAction) } is present, but trying to add ${ printAction(newAction) }
      `)
      throw new Error(`Conflict.`)
    }
  }

  private checkGotoConflicts (from: SlrNode, symbol: NonTerminalCtor) {
    if (!this.gotos.has(symbol)) this.gotos.set(symbol, new Map())
    if (this.gotos.get(symbol)!.has(from)) throw new Error(`Conflict.`)
  }

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

class AstBuilder {

  private roots: Array<NonTerminal | Terminal> = []

  public shift (newItem: NonTerminal | Terminal) {
    this.roots.push(newItem)
  }

  public reduce (rule: Rule) {
    const acceptFunction = (rule.lhs as any)[rule.getAcceptingFunctionName()]
    const argsCount = rule.getRhsLength()
    this.assertRootsLength(argsCount)
    const args = this.roots.splice(-argsCount, argsCount)
    const newNode = acceptFunction(...args)
    this.roots.push(newNode)
  }

  public getResult () {
    console.assert(this.roots.length == 1, `Expected AstBuilder to leave only a single root`)
    return this.roots[0]
  }

  private assertRootsLength (min: number) {
    console.assert(this.roots.length >= min, `AstBuilder's stack unexpectedly short.`)
  }

}

export class ShiftReduceTraceItem {
  private readonly stack: string
  private readonly input: string
  private readonly action: string

  constructor (stack: string,
               input: string,
               action: string) {
    this.stack = stack.padEnd(80)
    this.input = input.padEnd(80)
    this.action = action.padEnd(5)
  }

  public toString () {
    return `${ this.stack }   ${ this.input }   ${ this.action }`
  }
}

export class ShiftReducer {

  private astBuilder = new AstBuilder()
  private stack = new Stack<SlrNode | Terminal | NonTerminalCtor>()
  private inputIndex = 0
  private terminals: Array<Terminal> = []

  private get current () {
    return this.terminals[this.inputIndex] || eof
  }

  private reset () {
    this.astBuilder = new AstBuilder()
    this.stack = new Stack()
    this.inputIndex = 0
    this.terminals = []
  }

  constructor (private table: SlrTable,
               private logger: Logger<ShiftReduceTraceItem> = new DefaultLogger<ShiftReduceTraceItem>()) {
  }

  public buildAst (terminals: Array<Terminal>) {
    this.reset()
    this.terminals = terminals

    this.stack.push(this.table.getStartState())

    while (true) {
      this.assertTopOfStack()
      const stackTop = this.stack.peek() as SlrNode
      const action = this.table.getAction(isEof(this.current) ? eof : getCtor(this.current), stackTop) // todo: fix this stupid eof check
      switch (action.type) {
        case LrActionType.Shift: {
          this.addToLogger(action)
          this.stack.push(this.current)
          this.stack.push(action.node)
          this.astBuilder.shift(this.current)
          this.inputIndex++
          break
        }
        case LrActionType.Reduce: {
          this.addToLogger(action)
          const rhsLength = action.rule.getRhsLength()
          this.stack.pop(2 * rhsLength)
          this.assertTopOfStack()
          const currentStackTop = this.stack.peek() as SlrNode
          this.stack.push(action.rule.lhs)
          this.stack.push(this.table.getGoto(action.rule.lhs, currentStackTop)!)
          this.astBuilder.reduce(action.rule)
          break
        }
        case LrActionType.Accept:
          this.addToLogger(action)
          return this.astBuilder.getResult()
        case LrActionType.Error:
          this.addToLogger(action)
          this.printContextBeforeError()
          throw new Error(`Could not parse.`)
      }
    }
  }

  private addToLogger (action: LrAction) {
    const stack = this.stack.toArray().map(item => {
      if (item instanceof SlrNode) {
        return this.table.graph.nodes.indexOf(item)
      } else {
        return item.toString()
      }
    }).join(' ')

    const currentTerminal = this.current.toString()

    let printedAction!: string
    switch (action.type) {
      case LrActionType.Error:
        printedAction = ''
        break
      case LrActionType.Accept:
        printedAction = 'acc'
        break
      case LrActionType.Shift:
        printedAction = `s${ this.table.graph.nodes.indexOf(action.node) }`
        break
      case LrActionType.Reduce:
        printedAction = `r${ this.table.augmentedGrammar.getRules().indexOf(action.rule) }`
        break
      default:
        printedAction = '???'
    }

    this.logger.add(new ShiftReduceTraceItem(stack, currentTerminal, printedAction))
  }

  private assertTopOfStack () {
    const stackTop = this.stack.peek()
    if (!(stackTop instanceof SlrNode)) {
      this.printContextBeforeError()
      throw new Error(`Expected top of stack to be a SLR node, found ${ stackTop }`)
    }
  }

  private printContextBeforeError () {
    console.error(`============================================================`)
    console.error(this.table.augmentedGrammar.toString())
    console.error(`------------------------------------------------------------`)
    console.error(`NON-TERMINALS`)
    console.error([...this.table.augmentedGrammar.getNonTerminals()].join('\n'))
    console.error(`------------------------------------------------------------`)
    console.error(`TERMINALS`)
    console.error([...this.table.augmentedGrammar.getTerminals()].join('\n'))
    console.error(`------------------------------------------------------------`)
    console.error(`FIRSTS`)
    console.error(this.table.augmentedGrammar.printFirst())
    console.error(`------------------------------------------------------------`)
    console.error(`FOLLOWS`)
    console.error(this.table.augmentedGrammar.printFollow())
    console.error(`------------------------------------------------------------`)
    console.error(this.table.toString())
    console.error(`------------------------------------------------------------`)
    console.error(this.terminals.join(' '))
    console.error(this.logger.getAll().join('\n'))
    console.error(`============================================================`)
  }

}

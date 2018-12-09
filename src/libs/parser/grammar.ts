import { Rule } from './rules'
import { eps, Eps, isEps } from './eps'
import { eof, Eof } from './eof'
import { addAndReport, indexesOf } from './helpers'
import { isNonTerminalCtor, NonTerminalCtor, TerminalCtor } from './decorators'
import { Stack } from '../stack'

export class Grammar {

  private terminals = new Set<TerminalCtor>()
  private nonTerminals = new Set<NonTerminalCtor>()

  private firstSets = new Map<TerminalCtor | NonTerminalCtor | Eps, Set<Eps | TerminalCtor>>()
  private followSets = new Map<NonTerminalCtor, Set<Eof | TerminalCtor>>()

  private rules = new Set<Rule>()
  private readonly startSymbol: NonTerminalCtor

  public constructor (startSymbol: Function) {
    if (!isNonTerminalCtor(startSymbol)) {
      throw new Error(`The starting symbol must be a class with at least one method decorated as a @rule().`)
    }
    this.startSymbol = startSymbol
    this.collectRules()
    this.computeFirstSets()
    this.computeFollowSets()
  }

  public getRules () {
    return this.rules
  }

  public getStartingNonTerminal () {
    return this.startSymbol
  }

  public getTerminals () {
    return this.terminals
  }

  public hasTerminal (terminalCtor: any): terminalCtor is TerminalCtor {
    return this.terminals.has(terminalCtor)
  }

  public getNonTerminals () {
    return this.nonTerminals
  }

  public first (symbol: Eps | NonTerminalCtor | TerminalCtor): Set<Eps | TerminalCtor> {
    return this.firstSets.get(symbol)!
  }

  public follow (symbol: NonTerminalCtor): Set<Eof | TerminalCtor> {
    return this.followSets.get(symbol)!
  }

  public getRulesWithLhs (nonTerminal: NonTerminalCtor): Array<Rule> {
    const result: Array<Rule> = []
    for (const rule of this.rules) {
      if (rule.lhs == nonTerminal) {
        result.push(rule)
      }
    }
    return result
  }

  public getEpsilonRule (nonTerminal: NonTerminalCtor): Rule | null {
    for (const rule of this.rules) {
      if (rule.lhs == nonTerminal) {
        if (rule.rhs().length == 1 && isEps(rule.rhs()[0])) {
          return rule
        }
      }
    }
    return null
  }

  public printAllRules ({ withIndexes = false } = {}): string {
    return [...this.rules]
      .map((rule, index) => {
        return withIndexes
          ? `${ `(${ index })`.padStart(5) }   ${ rule }`
          : rule
      })
      .join('\n')
  }

  private printSets (map: Map<NonTerminalCtor | TerminalCtor | Eof | Eps, Set<NonTerminalCtor | TerminalCtor | Eof | Eps>>) {
    const rows: string[] = []
    for (const [left, set] of map) {
      rows.push(`${ left } => { ${ [...set].join(', ') } }`)
    }
    return rows.join('\n')
  }

  public printFirst () {
    return this.printSets(this.firstSets)
  }

  public printFollow () {
    return this.printSets(this.followSets)
  }

  private collectRules () {

    // As we go through the rules, we push to stack classes which we didn't examine yet.
    // The stack will contain both terminals and non-terminals, but we won't know what
    // we're looking at until we try to see if it has any rules attached to it.
    // When we pop from the stack, we look at the retrieved symbol: if it has rules
    // attached to it, we collect them to the stack and add it to the set of non-terminals.
    // If it has no rules, it means it's a terminal so we add it to the appropriate set
    // and keep moving.
    const stack = new Stack<NonTerminalCtor>()
    stack.push(this.startSymbol)

    this.nonTerminals.add(this.startSymbol)

    // We keep track of terminals which we've examined so we don't fall into an
    // infinite loop.
    const visitedNonTerminals = new Set<NonTerminalCtor>()

    while (stack.isNotEmpty()) {
      const nonTerminal = stack.pop()
      visitedNonTerminals.add(nonTerminal)

      const rules = nonTerminal.__rules__
      for (const rule of rules) {
        this.rules.add(rule)
        // visitedNonTerminals.add(rule.lhs)

        const moreSymbols = rule.rhs()
        for (const symbol of moreSymbols) {
          if (isNonTerminalCtor(symbol)) {
            if (!visitedNonTerminals.has(symbol)) {
              stack.push(symbol)
              this.nonTerminals.add(symbol)
            }
          } else if (!isEps(symbol)) {
            // it's a terminal
            symbol.toString = () => symbol.name
            this.terminals.add(symbol)
          }
        }
      }
    }
  }

  private computeFirstSets () {
    this.firstSets.set(eps, new Set([eps]))

    for (const terminal of this.terminals) {
      this.firstSets.set(terminal, new Set([terminal]))
    }

    for (const nonTerminal of this.nonTerminals) {
      this.firstSets.set(nonTerminal, new Set())
    }


    let isChanged
    do {
      isChanged = false
      for (const rule of this.rules) {
        const firstRhsSymbol = rule.rhs()[0]
        if (this.hasTerminal(firstRhsSymbol)) {
          isChanged = isChanged || addAndReport(this.firstSets.get(rule.lhs)!, firstRhsSymbol)
        }
        if (isNonTerminalCtor(firstRhsSymbol)) {
          isChanged = isChanged || addAndReport(this.firstSets.get(rule.lhs)!, ...this.firstOfString(rule.rhs()))
        }
      }
    } while (isChanged)
  }

  private firstOfString (symbols: Array<TerminalCtor | NonTerminalCtor | Eps>): Set<Eps | TerminalCtor> {
    if (symbols.length == 0) return new Set()
    if (symbols.length == 1) {
      const symbol = symbols[0]
      const result = this.firstSets.get(symbol)
      if (result == null) {
        throw new Error(`Tried to find first of ${ symbol }, but it's not in firstSets.`)
      }
      return result
    }

    const result = new Set(this.first(symbols[0]))

    if (result.has(eps)) {
      result.delete(eps)
      for (const symbolToAdd of this.firstOfString(symbols.slice(1))) {
        result.add(symbolToAdd)
      }
    }

    return result
  }

  private computeFollowSets () {
    for (const nonTerminal of this.nonTerminals) {
      this.followSets.set(nonTerminal, new Set())
    }

    this.followSets.get(this.startSymbol)!.add(eof)

    let isChanged
    do {
      isChanged = false
      for (const nonTerminal of this.nonTerminals) {
        const followSet = this.followSets.get(nonTerminal)!

        for (const rule of this.rules) {
          const nonTerminalIndexes = indexesOf(rule.rhs(), nonTerminal)

          for (const nonTerminalIndex of nonTerminalIndexes) {
            const rightOfNonTerminal = rule.rhs().slice(nonTerminalIndex + 1)

            const firstOfRightOfNonTerminal = this.firstOfString(rightOfNonTerminal)
            let hasEps = false
            for (const symbol of firstOfRightOfNonTerminal) {
              if (isEps(symbol)) {
                hasEps = true
              } else {
                isChanged = isChanged || addAndReport(followSet, symbol)
              }
            }

            if (rightOfNonTerminal.length == 0 || hasEps) {
              const followOfLhs = this.followSets.get(rule.lhs)
              if (followOfLhs == null) {
                throw new Error(
                  `Expected to find LHS of ${ rule } in this.followSets.\n${ this.printSets(this.followSets) }`,
                )
              }
              for (const symbol of followOfLhs) {
                isChanged = isChanged || addAndReport(followSet, symbol)
              }
            }
          }
        }
      }
    } while (isChanged)
  }

  private assertTerminalIsRegistered (terminal: TerminalCtor) {
    if (!this.terminals.has(terminal)) {
      throw new Error(`You must first register the terminal ${ terminal.name }.`)
    }
  }

  private assertNonTerminalIsRegistered (nonTerminal: NonTerminalCtor) {
    if (!this.nonTerminals.has(nonTerminal)) {
      throw new Error(`You must first register the terminal ${ nonTerminal.toString() }.`)
    }
  }

}

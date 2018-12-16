import { Grammar } from './grammar'
import { SlrTable, ShiftReducer } from './slr-parser'
import { getCtor, Terminal } from './decorators'

export class Parser {

  public constructor (public grammar: Grammar) {
  }

  public parse (terminals: Array<any>) {
    const unknownTerminals = terminals.filter(terminal => !this.grammar.isKnownTerminal(getCtor(terminal) as any))
    if (unknownTerminals.length > 0) {
      const e = new Error(`Cannot parse because the array of tokens contains unknown terminals`)
      console.error(e)
      console.error(unknownTerminals.join('\n'))
      throw e
    }
    const typedTerminals = terminals as Array<Terminal>
    const table = new SlrTable(this.grammar)
    const shiftReducer = new ShiftReducer(table)
    return shiftReducer.buildAst(terminals)
  }

}

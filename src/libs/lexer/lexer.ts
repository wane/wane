import { Character, EOF } from './helpers'

export type Ctor<T = {}> = new (...args: any[]) => T

export function Positioned<T extends Ctor> (baseClass: T) {
  return class extends baseClass {

    protected startPos: number | null = null
    protected endPos: number | null = null

    public setStart (startPos: number): this {
      this.startPos = startPos
      return this
    }

    public getStart (): number | null {
      return this.startPos
    }

    public getStartOrThrow (): number {
      const start = this.getStart()
      if (start == null) throw new Error(`Expected start to be defined.`)
      return start
    }

    public hasStart (): boolean {
      return this.getStart() != null
    }

    public setEnd (endPos: number): this {
      this.endPos = endPos
      return this
    }

    public getEnd (): number | null {
      return this.endPos
    }

    public getEndOrThrow () {
      const end = this.getEnd()
      if (end == null) throw new Error(`Expected end to be defined.`)
      return end
    }

    public hasEnd (): boolean {
      return this.getEnd() != null
    }

    public setPos (start: number, end: number): this {
      return this.setStart(start).setEnd(end)
    }

    public hasPos (): boolean {
      return this.hasStart() && this.hasEnd()
    }

    public printPos () {
      return `${ this.getStart() }:${ this.getEnd() }`
    }
  }

}

export function Errorable<T extends Ctor> (baseClass: T) {
  return class extends baseClass {
    protected isError: boolean = false

    public setError (): this {
      this.isError = true
      return this
    }
  }
}

export function WithData<T extends Ctor> (baseClass: T) {
  return class extends baseClass {
    protected data: string = ''

    public appendData (...strings: Array<string>): this {
      for (const string of strings) {
        this.data += string
      }
      return this
    }

    public getData () {
      return this.data
    }
  }
}

// endregion Mixins

export abstract class Token extends Positioned(Errorable(class {
})) {
  public abstract kind: string
}

export class EndOfFileToken extends Token {
  kind = '$'
}

export type TokenCtor<T extends Token = Token> = { new (...args: any[]): T }

export class Tokens<T extends Token = Token> {

  private tokens: Array<T> = []

  constructor (tokens?: Iterable<T>) {
    if (tokens !== undefined) {
      for (const token of tokens) {
        this.add(token)
      }
    }
  }

  public add (token: T) {
    this.tokens.push(token)
  }

  public toArray () {
    return this.tokens
  }

}

export type State = () => void

export abstract class Lexer<T extends Token = Token> {

  private input: string = ''

  private state!: State

  /**
   * The index of the just consumed character.
   */
  private inputIndex!: number

  private currentToken: T | EndOfFileToken | undefined = undefined

  private emittedTokens!: Tokens<T>

  private hasParseError: boolean = false

  protected abstract startState: State

  constructor () {
  }

  public lex (input: string) {
    this.input = input
    this.emittedTokens = new Tokens<T>()
    this.hasParseError = false
    this.state = this.startState
    this.inputIndex = -1
    this.lexLoop()
    return this.emittedTokens
  }

  private lexLoop () {
    while (this.inputIndex < this.input.length) {
      this.state()
    }
  }

  protected switchTo (state: State) {
    this.state = state
    return this
  }

  /**
   * Create a new token.
   * If start is not set, sets it to the index of just consumed character, offseted by the optional delay.
   * If there is a current token which is left unhandled, it throws.
   *
   * @param {Token} token The token to create.
   * @param {number} delay How many characters were we when creating this?
   * @returns {this} For fluid API.
   */
  protected create (token: T | EndOfFileToken, delay?: number): this {
    if (this.currentToken != null) throw new Error(`Attempted to create a new token before cleaning the previous.`)
    if (!token.hasStart()) token.setStart(this.inputIndex - (delay || 0))
    this.currentToken = token
    return this
  }

  protected discardCurrentToken<V extends T = T> (token: TokenCtor<V>): this {
    this.currentToken = undefined
    return this
  }

  /**
   * Emits the previously created token.
   *
   * If ending is not set, it sets it as if the current input character is its last character.
   */
  protected emit (delay: number = 0): this {
    const token = this.getToken()
    if (!token.hasEnd()) token.setEnd(this.inputIndex + 1 - delay)
    this.emittedTokens.add(token)
    this.currentToken = undefined
    return this
  }

  protected getToken<V extends T = T> (ctor?: TokenCtor<V>): V {
    const token = this.currentToken
    if (token == null) throw new Error(`Expected current token to be defined.`)
    if (ctor != null && !(token instanceof ctor)) throw new Error(`Expected current token to be of type ${ ctor.name }, but was ${ token.constructor.name } instead.`)
    return token as V
  }

  protected getTokenOrUndefined (): T | EndOfFileToken | undefined {
    return this.currentToken
  }

  private shouldReconsume: boolean = false

  protected consume (): Character {
    if (this.shouldReconsume) {
      this.shouldReconsume = false
      return this.input[this.inputIndex]
    } else {
      this.inputIndex++
      return this.input[this.inputIndex] || EOF
    }
  }

  protected getIndex (): number {
    return this.inputIndex
  }

  /**
   * Peek into the future characters without any side-effects to tell if it matches a string.
   *
   * @param {string} needle The string to check for.
   * @returns {boolean} If the future starts with `needle`.
   */
  protected lookahead (needle: string): boolean {
    return this.input.slice(this.inputIndex + 1).startsWith(needle)
  }

  /**
   * A shortcut to a sequence of `markToReconsume` and `switchTo`.
   *
   * @param {State} state The state passed to `switchTo` method.
   * @returns {this} For fluid API.
   */
  protected reconsumeIn (state: State): this {
    this.state = state
    this.shouldReconsume = true
    return this
  }

  /**
   * A short way to create and emit an end of file token.
   * Handles the position correctly (zero width character).
   *
   * @returns {this} For fluid API.
   */
  protected emitEof (): this {
    return this.create(new EndOfFileToken().setEnd(this.getIndex())).emit()
  }

  protected parseError (): this {
    this.getToken().setError()
    return this
  }

}

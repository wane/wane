import { Token, WithData } from '../../libs/lexer'

export class MarkupToken extends Token {
}

export class CharacterToken extends MarkupToken {

  private data: string = ''

  public constructor (data?: string) {
    super()
    if (data != null) this.data = data
  }

}

export class Attribute {

  private name: string = ''

  private value: string = ''

  public appendToName (...characters: Array<string>): this {
    for (const character of characters) {
      this.name += character
    }
    return this
  }

  public getName (): string {
    return this.name
  }

  public appendToValue (...characters: Array<string>): this {
    for (const character of characters) {
      this.value += character
    }
    return this
  }

  public getValue (): string {
    return this.value
  }

}

/**
 * The usual HTML-like attributes.
 *
 * The main difference from HTML is that Wane Templates force usage of
 * quotes to surround the attribute values. Since Expression Attributes
 * and Invocation Attributes would need them anyway, we make code cleaner
 * by forcing on PlainAttribute as well.
 *
 * Note that just because it's a Plain Attribute, it doesn't mean that
 * it's an HTML attribute (as opposed to a Wane input into a component).
 * It only talks about the syntax. For example, the following two lines
 * are semantically the same, but syntactically different, assuming that
 * a component named `Component` has an input named `input`.
 *
 * ```html
 * <Component [input]="'value'">
 * <Component input="value">
 * ```
 */
export class PlainAttribute extends Attribute {

  /**
   * If the authored code used a "boolean" version of an attribute or not.
   *
   * This information is not in the specification because HTML doesn't
   * make a difference between <p hidden> and <p hidden="">.
   * In Wane, however, this is a difference between passing a boolean
   * true value and an empty string, respectively, in case "hidden"
   * is an input of the component it's used on.
   */
  private isBoolean: boolean = false

  public declareBoolean () {
    this.isBoolean = true
  }

}

export class NonPlainAttribute extends Attribute {

}

export class ExpressionAttribute extends NonPlainAttribute {

}

export class InvocationAttribute extends NonPlainAttribute {

}

type AttributeCtor<T extends Attribute = Attribute> = { new (...args: any[]): T }

export class TagToken extends MarkupToken {

  private tagName: string = ''
  private selfClosingFlag: boolean = false
  private attributes: Array<Attribute> = []

  constructor (tagName?: string) {
    super()
    if (tagName != null) this.tagName = tagName
  }

  public appendToTagName (str: string) {
    this.tagName += str
  }

  public isSelfClosing (): boolean {
    return this.selfClosingFlag
  }

  public declareSelfClosing () {
    this.selfClosingFlag = true
  }

  private startNewAttribute<T extends Attribute> (ctor: AttributeCtor<T>): T {
    const attribute = new ctor()
    this.attributes.push(attribute)
    return attribute
  }

  public startNewPlainAttribute () {
    return this.startNewAttribute(PlainAttribute)
  }

  public startNewExpressionAttribute () {
    return this.startNewAttribute(ExpressionAttribute)
  }

  public startNewInvocationAttribute () {
    return this.startNewAttribute(InvocationAttribute)
  }

  public getAttribute<T extends Attribute> (ctor?: AttributeCtor<T>): T {
    const attribute = this.getAttributeOrUndefined()
    if (attribute == null) {
      throw new Error(`Expected current attribute to be defined.`)
    }
    if (ctor != null && !(attribute instanceof ctor)) {
      throw new Error(`Expected current attribute to be of type ${ ctor.name }, but was ${ attribute.constructor.name } instead.`)
    }
    return attribute as T
  }

  public getAttributeOrUndefined (): Attribute | undefined {
    return this.attributes[this.attributes.length - 1]
  }

  public isExpressionAttribute () {
    return this.getAttribute() instanceof ExpressionAttribute
  }

  public isInvocationAttribute () {
    return this.getAttribute() instanceof InvocationAttribute
  }

}

export class StartTagToken extends TagToken {

}

export class EndTagToken extends TagToken {

}

export class CommentToken extends WithData(MarkupToken) {

  private isBogusFlag: boolean = false

  constructor (data?: string) {
    super()
    if (data != null) this.data = data
  }

  public declareBogus () {
    this.isBogusFlag = true
    return this
  }

}

export class InterpolationToken extends WithData(MarkupToken) {

  constructor (data?: string) {
    super()
    if (data != null) this.data = data
  }

}


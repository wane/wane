import {
  Attribute,
  EndTagToken,
  ExpressionAttribute,
  InterpolationToken,
  InvocationAttribute,
  PlainAttribute,
  StartTagToken,
} from '../lexer'
import {
  ExpressionTree,
  InvocationTree,
  parseExpression,
  parseInvocation,
  InterpolationTree,
  parseInterpolation,
} from '../../binding'
import {
  TraversalControl,
  forEach,
  forEachDescendant,
  find,
  findOrThrow,
  filter,
  findDescendant,
  findDescendantOrThrow,
  filterDescendants,
} from '../../../libs/traversals'
import { Guard, Predicate } from '../../../libs/helper-types'
import * as tg from 'type-guards'
import { isInstance } from '../../../libs/is-instance-ts'
import { TagNamesLists } from './lists'


export abstract class WtmlNode {

  protected parent: WtmlNode | null = null

  public registerParent (parent: WtmlNode) {
    this.parent = parent
  }

  public getParentOrNull (): WtmlNode | null {
    return this.parent
  }

  public getParent (): WtmlNode {
    const parent = this.getParentOrNull()
    if (parent == null) throw new Error(`Expected to find a parent.`)
    return parent
  }

  public abstract getStart (): number

  public abstract getEnd (): number

  public abstract printPos (): string

  protected children: Array<WtmlNode> = []

  public getChildren (): Array<WtmlNode> { return this.children }

  public getFirstChild (): WtmlNode | undefined { return this.children[0] }

  public getLastChild (): WtmlNode | undefined { return this.children[this.children.length - 1] }

  public addChildren (...children: Array<WtmlNode>): this {
    for (const child of children) {
      child.registerParent(this)
    }
    this.children.push(...children)
    return this
  }

  // region Traversal

  public forEach (operation: (node: WtmlNode, traversal: TraversalControl) => void): void {
    forEach(this, operation)
  }

  public forEachDescendant (operation: (node: WtmlNode, traversal: TraversalControl) => void): void {
    forEachDescendant(this, operation)
  }

  public find<T extends WtmlNode> (guard: Guard<WtmlNode, T>): T | undefined
  public find (predicate: Predicate<WtmlNode>): WtmlNode | undefined
  public find (fn: Predicate<WtmlNode>): WtmlNode | undefined {
    return find(this, fn)
  }

  public findOrThrow<T extends WtmlNode> (guard: Guard<WtmlNode, T>): T
  public findOrThrow (predicate: Predicate<WtmlNode>): WtmlNode
  public findOrThrow (fn: Predicate<WtmlNode>): WtmlNode {
    return findOrThrow(this, fn)
  }

  public findElementOrThrow<T extends WtmlElementNode> (guard: Guard<WtmlElementNode, T>): T
  public findElementOrThrow (predicate: Predicate<WtmlElementNode>): WtmlElementNode
  public findElementOrThrow (tagName: string): WtmlElementNode
  public findElementOrThrow (predicateOrTagName: Predicate<WtmlElementNode> | string): WtmlElementNode {
    return typeof predicateOrTagName == 'string'
      ? this.findElementOrThrow(e => e.getTagName() == predicateOrTagName)
      : this.findOrThrow(tg.fp.and(isInstance(WtmlElementNode), predicateOrTagName))
  }

  public filter<T extends WtmlNode> (guard: Guard<WtmlNode, T>): Array<T>
  public filter (predicate: Predicate<WtmlNode>): Array<WtmlNode>
  public filter (fn: Predicate<WtmlNode>): Array<WtmlNode> {
    return filter(this, fn)
  }

  public findDescendant<T extends WtmlNode> (guard: Guard<WtmlNode, T>): T | undefined
  public findDescendant (predicate: Predicate<WtmlNode>): WtmlNode | undefined
  public findDescendant (fn: Predicate<WtmlNode>): WtmlNode | undefined {
    return findDescendant(this, fn)
  }

  public findDescendantOrThrow<T extends WtmlNode> (guard: Guard<WtmlNode, T>): T
  public findDescendantOrThrow (predicate: Predicate<WtmlNode>): WtmlNode
  public findDescendantOrThrow (fn: Predicate<WtmlNode>): WtmlNode {
    return findDescendantOrThrow(this, fn)
  }

  public filterDescendants<T extends WtmlNode> (guard: Guard<WtmlNode, T>): Array<T>
  public filterDescendants (predicate: Predicate<WtmlNode>): Array<WtmlNode>
  public filterDescendants (fn: Predicate<WtmlNode>): Array<WtmlNode> {
    return filterDescendants(this, fn)
  }

  public getAllDescendants () { return this.filterDescendants(() => true) }

  // endregion Traversal

}

export class WtmlPhantomRootNode extends WtmlNode {

  protected parent: null = null

  public getStart (): number {
    const firstChild = this.getFirstChild()
    if (firstChild == null) return 0
    return firstChild.getStart()
  }

  public getEnd (): number {
    const lastChild = this.getLastChild()
    if (lastChild == null) return 0
    return lastChild.getEnd()
  }

  public printPos (): string { return `${ this.getStart() }:${ this.getEnd() }` }

}

export class WtmlTextNode extends WtmlNode {

  protected data: string = ''

  protected start: number | undefined
  protected end: number | undefined

  constructor (data?: string) {
    super()
    if (data != null) this.data += data
  }

  public setStart (start: number): this {
    this.start = start
    return this
  }

  public setEnd (end: number): this {
    this.end = end
    return this
  }

  public setPos (start: number, end: number): this { return this.setStart(start).setEnd(end) }

  public getStart (): number {
    if (this.start == null) throw new Error(`Expected start to be defined.`)
    return this.start
  }

  public getEnd () {
    if (this.end == null) throw new Error(`Expected end to be defined.`)
    return this.end
  }

  public printPos () { return `${ this.getStart() }:${ this.getEnd() }` }

  public addChildren (): this { throw new Error(`Cannot add children to a leaf node.`) }

}

export class WtmlInterpolationNode extends WtmlNode {

  public static Create (token: InterpolationToken) {
    const tree = parseInterpolation(token.getData())
    return new WtmlInterpolationNode(token, tree)
  }

  constructor (private token: InterpolationToken,
               protected tree: InterpolationTree) {
    super()
  }

  public getBindingSyntaxTree (): InterpolationTree { return this.tree }

  public getText (): string { return this.token.getData() }

  public getStart (): number { return this.token.getStartOrThrow() }

  public getEnd (): number { return this.token.getEndOrThrow() }

  public printPos () { return `${ this.getStart() }:${ this.getEnd() }` }

  public addChildren (): this { throw new Error(`Cannot add children to a leaf node.`) }

}

export class WtmlElementNode extends WtmlNode {

  public static Create (
    token: StartTagToken,
    lists: TagNamesLists,
  ): WtmlElementNode {
    const tagName = token.getTagName()

    const name = token.getTagName()
    let element
    if (name.startsWith('w-')) {
      element = new WtmlDirectiveNode(token)
    } else if (name[0].toLowerCase() == name[0]) {
      if (!lists.allowedTagNames.includes(tagName)) {
        throw new Error(`Unknown element ${ tagName }.`)
      }
      element = new WtmlElementNode(token)
    } else {
      element = new WtmlComponentNode(token)
    }
    return element
  }

  protected parent!: WtmlNode

  protected attributes!: Array<WtmlAttribute>

  protected startTagToken: StartTagToken
  protected endTagToken: EndTagToken | undefined

  constructor (startTagToken: StartTagToken) {
    super()
    this.startTagToken = startTagToken
    this.computeAttributes()
  }

  public getTagName (): string {
    return this.startTagToken.getTagName()
  }

  public getAttributes<T extends WtmlAttribute> (guard: Guard<WtmlAttribute, T>): Array<T>
  public getAttributes (predicate: Predicate<WtmlAttribute>): Array<WtmlAttribute>
  public getAttributes (): Array<WtmlAttribute>
  public getAttributes (predicateOrNothing?: Predicate<WtmlAttribute>): Array<WtmlAttribute> {
    if (predicateOrNothing === undefined) return this.attributes
    return this.attributes.filter(predicateOrNothing)
  }

  public getPlainAttributes () { return this.getAttributes(isInstance(WtmlPlainAttribute)) }

  public getBracketedAttributes () { return this.getAttributes(isInstance(WtmlBracketedAttribute)) }

  public getParenthesisedAttributes () { return this.getAttributes(isInstance(WtmlParenthesisedAttribute)) }

  public getAttributeOrThrow<T extends WtmlAttribute> (guard: Guard<WtmlAttribute, T>): T
  public getAttributeOrThrow (predicate: Predicate<WtmlAttribute>): WtmlAttribute
  public getAttributeOrThrow (fn: Predicate<WtmlAttribute>): WtmlAttribute {
    const result = this.attributes.find(fn)
    if (result == null) throw new Error(`Expected to find an attribute.`)
    return result
  }

  public getPlainAttributeOrThrow (name: string) {
    return this.getAttributeOrThrow(tg.fp.and(
      isInstance(WtmlPlainAttribute),
      attr => attr.getName() == name,
    ))
  }

  public getBracketedAttributeOrThrow (name: string) {
    return this.getAttributeOrThrow(tg.fp.and(
      isInstance(WtmlBracketedAttribute),
      attr => attr.getName() == name,
    ))
  }

  public getParenthesisedAttributeOrThrow (name: string) {
    return this.getAttributeOrThrow(tg.fp.and(
      isInstance(WtmlParenthesisedAttribute),
      attr => attr.getName() == name,
    ))
  }

  public getStart (): number { return this.startTagToken.getStartOrThrow() }

  public getEnd (): number {
    if (this.endTagToken == null) throw new Error(`Expected end to be defined.`)
    return this.endTagToken.getEndOrThrow()
  }

  public printPos () { return `${ this.getStart() }:${ this.getEnd() }` }

  public registerEndTagToken (endTagToken: EndTagToken): this {
    this.endTagToken = endTagToken
    return this
  }

  private computeAttributes () {
    this.attributes = this.startTagToken.getAttributes().map(attr => {
      return WtmlAttribute.Create(attr)
    })
  }

}

export class WtmlDirectiveNode extends WtmlElementNode {

  public static PREFIX = 'w-'

  public getName (): string {
    const fullTagName = this.getTagName()
    console.assert(fullTagName.startsWith(WtmlDirectiveNode.PREFIX))
    return fullTagName.slice(WtmlDirectiveNode.PREFIX.length)
  }

}

export class WtmlComponentNode extends WtmlElementNode {

  public getName (): string {
    return this.getTagName()
  }

}

export class WtmlAttribute {

  public static Create (attribute: Attribute): WtmlAttribute {
    if (attribute instanceof PlainAttribute) {
      return attribute.isBoolean()
        ? new WtmlBooleanAttribute(attribute.getName())
        : new WtmlPlainAttribute(attribute.getName(), attribute.getValue())
    } else if (attribute instanceof ExpressionAttribute) {
      const tree = parseExpression(attribute.getValue())
      return new WtmlBracketedAttribute(attribute.getName(), tree)
    } else if (attribute instanceof InvocationAttribute) {
      const tree = parseInvocation(attribute.getValue())
      return new WtmlParenthesisedAttribute(attribute.getName(), tree)
    } else {
      throw new Error(`Unknown type of attribute.`)
    }
  }

  constructor (protected name: string) {
  }

  public getName () { return this.name }

}

export class WtmlBooleanAttribute extends WtmlAttribute {

}

type PlainAttributeValue = string
type AttributeValue = PlainAttributeValue | ExpressionTree | InvocationTree

export class WtmlAttributeWithValue<V extends AttributeValue> extends WtmlAttribute {

  constructor (name: string, protected value: V) {
    super(name)
  }

  public getValue () { return this.value }

}

export class WtmlPlainAttribute extends WtmlAttributeWithValue<PlainAttributeValue> {

}

export class WtmlBracketedAttribute extends WtmlAttributeWithValue<ExpressionTree> {

  /**
   * @alias getValue
   */
  public getBindingSyntaxTree () { return this.getValue() }

}

export class WtmlParenthesisedAttribute extends WtmlAttributeWithValue<InvocationTree> {

  /**
   * @alias getValue
   */
  public getBindingSyntaxTree () { return this.getValue() }

}

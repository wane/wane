import { rule, eps } from '../../../libs/parser'
import * as t from '../lexer/binding-tokens'
import {
  TraversalControl,
  forEach,
  forEachDescendant,
  findOrThrow,
  find,
  findDescendant,
  filter,
  findDescendantOrThrow,
  filterDescendants,
} from '../../../libs/traversals'
import { Guard, Predicate } from '../../../libs/helper-types'


/*

http://jsmachines.sourceforge.net/machines
http://jsmachines.sourceforge.net/machines/slr.html

Start -> Interpolation

Interpolation -> Expression
Interpolation -> PipeExpression

Expression -> id
Expression -> Literal
Expression -> ElementAccessExpression
Expression -> PropertyAccessExpression

Literal -> string
Literal -> number
Literal -> boolean
Literal -> undefined
Literal -> null

ElementAccessExpression -> Expression [ Expression ]
PropertyAccessExpression -> Expression . id
PipeExpression -> Expression |> Invocation

Invocation -> Expression ( ParameterList )

ParameterList -> ''
ParameterList -> Parameter
ParameterList -> Parameter , ParameterList

Parameter -> Expression
Parameter -> #

 */

export abstract class BindingNode {

  public abstract toString (): string

  public abstract getStart (): number

  public abstract getEnd (): number

  public abstract getChildren (): Array<BindingNode>

  public forEach (operation: (node: BindingNode, traversal: TraversalControl) => void): void {
    forEach(this, operation)
  }

  public forEachDescendant (operation: (node: BindingNode, traversal: TraversalControl) => void): void {
    forEachDescendant(this, operation)
  }

  public find<T extends BindingNode> (guard: Guard<BindingNode, T>): T | undefined
  public find (predicate: Predicate<BindingNode>): BindingNode | undefined
  public find (fn: Predicate<BindingNode>): BindingNode | undefined {
    return find(this, fn)
  }

  public findOrThrow<T extends BindingNode> (guard: Guard<BindingNode, T>): T
  public findOrThrow (predicate: Predicate<BindingNode>): BindingNode
  public findOrThrow (fn: Predicate<BindingNode>): BindingNode {
    return findOrThrow(this, fn)
  }

  public filter<T extends BindingNode> (guard: Guard<BindingNode, T>): Array<T>
  public filter (predicate: Predicate<BindingNode>): Array<BindingNode>
  public filter (fn: Predicate<BindingNode>): Array<BindingNode> {
    return filter(this, fn)
  }

  public findDescendant<T extends BindingNode> (guard: Guard<BindingNode, T>): T | undefined
  public findDescendant (predicate: Predicate<BindingNode>): BindingNode | undefined
  public findDescendant (fn: Predicate<BindingNode>): BindingNode | undefined {
    return findDescendant(this, fn)
  }

  public findDescendantOrThrow<T extends BindingNode> (guard: Guard<BindingNode, T>): T
  public findDescendantOrThrow (predicate: Predicate<BindingNode>): BindingNode
  public findDescendantOrThrow (fn: Predicate<BindingNode>): BindingNode {
    return findDescendantOrThrow(this, fn)
  }

  public filterDescendants<T extends BindingNode> (guard: Guard<BindingNode, T>): Array<T>
  public filterDescendants (predicate: Predicate<BindingNode>): Array<BindingNode>
  public filterDescendants (fn: Predicate<BindingNode>): Array<BindingNode> {
    return filterDescendants(this, fn)
  }

  /**
   * @example
   * a.b.z[c.d] |> e.f(g.h) => a, c, e, g
   */
  public abstract getUsedMembers (): Array<Identifier>
}


export abstract class Parameter extends BindingNode {

  @rule(() => [Expression])
  @rule(() => [ParameterPlaceholder])
  public static acceptParameter (parameter: Parameter) {
    return parameter
  }

  public toString () {
    return `Parameter`
  }

}

export class ParameterPlaceholder extends Parameter {

  @rule(() => [t.PlaceholderArgumentToken])
  public static acceptToken (token: t.PlaceholderArgumentToken) {
    return new ParameterPlaceholder(token)
  }

  constructor (protected readonly token: t.PlaceholderArgumentToken) {
    super()
  }

  public toString (): string { return `ParameterPlaceholder` }

  public getChildren (): Array<BindingNode> { return [] }

  public getStart (): number { return this.token.getStartOrThrow() }

  public getEnd (): number { return this.token.getEndOrThrow() }

  public getUsedMembers (): Array<Identifier> { return [] }

}

export abstract class Expression extends Parameter {

  @rule(() => [Identifier])
  @rule(() => [Literal])
  @rule(() => [ElementAccessExpression])
  @rule(() => [PropertyAccessExpression])
  public static acceptIdentifier (concreteExpression: Expression): Expression {
    return concreteExpression
  }

  public toString () { return `Expression???` }

}

export class Identifier extends Expression {

  @rule(() => [t.IdentifierToken])
  public static acceptIdentifierToken (token: t.IdentifierToken) {
    return new Identifier(token)
  }

  constructor (private token: t.IdentifierToken) {
    super()
  }

  public getData () { return this.token.getData() }

  public toString (): string { return `Identifier<${ this.token.getData() }>` }

  public getChildren (): Array<BindingNode> { return [] }

  public getStart (): number { return this.token.getStartOrThrow() }

  public getEnd (): number { return this.token.getEndOrThrow() }

  public getUsedMembers (): Array<Identifier> { return [this] }

}

export abstract class Literal extends Expression {

  @rule(() => [StringLiteral])
  @rule(() => [NumberLiteral])
  public static acceptLiteral (literal: Literal) {
    return literal
  }

  public constructor (protected readonly token: t.LiteralToken) {
    super()
  }

}

export class StringLiteral extends Literal {

  @rule(() => [t.StringLiteralToken])
  public static accept (token: t.StringLiteralToken) {
    return new StringLiteral(token)
  }

  public toString (): string {
    return `StringLiteral<${ this.token.getData() }>`
  }

  public getChildren (): Array<BindingNode> { return [] }

  public getStart (): number { return this.token.getStartOrThrow() }

  public getEnd (): number { return this.token.getEndOrThrow() }

  public getUsedMembers (): Array<Identifier> { return [] }

}

export class NumberLiteral extends Literal {

  @rule(() => [t.NumberLiteralToken])
  public static accept (token: t.NumberLiteralToken) {
    return new NumberLiteral(token)
  }

  public toString (): string { return `NumberLiteral<${ this.token.getData() }>` }

  public getChildren (): Array<BindingNode> { return [] }

  public getStart (): number { return this.token.getStartOrThrow() }

  public getEnd (): number { return this.token.getEndOrThrow() }

  public getUsedMembers (): Array<Identifier> { return [] }

}

export class ElementAccessExpression extends Expression {

  @rule(() => [Expression, t.OpenSquareBracketToken, Expression, t.CloseSquareBracketToken])
  public static accept (expression: Expression,
                        openSquareBracketToken: t.OpenSquareBracketToken,
                        argumentExpression: Expression,
                        closeSquareBracketToken: t.CloseSquareBracketToken) {
    return new ElementAccessExpression(expression, openSquareBracketToken, argumentExpression, closeSquareBracketToken)
  }

  public constructor (private readonly expression: Expression,
                      private readonly openSquareBracketToken: t.OpenSquareBracketToken,
                      private readonly argumentExpression: Expression,
                      private readonly closeSquareBracketToken: t.CloseSquareBracketToken) {
    super()
  }

  public toString () {
    return `ElementAccessExpression`
  }

  public getChildren (): Array<BindingNode> {
    return [
      this.expression,
      this.argumentExpression,
    ]
  }

  public getStart (): number { return this.expression.getStart() }

  public getEnd (): number { return this.closeSquareBracketToken.getEndOrThrow() }

  public getUsedMembers (): Array<Identifier> {
    return [
      ...this.expression.getUsedMembers(),
      ...this.argumentExpression.getUsedMembers(),
    ]
  }

}

export class PropertyAccessExpression extends Expression {

  @rule(() => [Expression, t.DotToken, Identifier])
  public static accept (expression: Expression, dot: t.DotToken, name: Identifier) {
    return new PropertyAccessExpression(expression, dot, name)
  }

  public constructor (private readonly expression: Expression,
                      private readonly dotToken: t.DotToken,
                      private readonly name: Identifier) {
    super()
  }

  public toString () {
    return `PropertyAccessExpression`
  }

  public getChildren (): Array<BindingNode> {
    return [
      this.expression,
      this.name,
    ]
  }

  public getStart (): number { return this.expression.getStart() }

  public getEnd (): number { return this.name.getEnd() }

  public getUsedMembers (): Array<Identifier> { return this.expression.getUsedMembers() }


}

export class FormattedExpression extends BindingNode {

  @rule(() => [Expression, t.PipeToken, Invocation])
  public static accept (expression: Expression, pipe: t.PipeToken, invocation: Invocation) {
    return new FormattedExpression(expression, pipe, invocation)
  }

  public constructor (private readonly expression: Expression,
                      private readonly pipeToken: t.PipeToken,
                      private readonly invocation: Invocation) {
    super()
  }

  public toString () {
    return `FormattedExpression`
  }

  public getChildren (): Array<BindingNode> {
    return [
      this.expression,
      this.invocation,
    ]
  }

  public getStart (): number { return this.expression.getStart() }

  public getEnd (): number { return this.invocation.getEnd() }

  public getUsedMembers (): Array<Identifier> {
    return [
      ...this.expression.getUsedMembers(),
      ...this.invocation.getUsedMembers(),
    ]

  }

}

export class Invocation extends BindingNode {

  @rule(() => [Expression, t.OpenParenToken, ParameterList, t.CloseParenToken])
  public static accept (expression: Expression,
                        openParenToken: t.OpenParenToken,
                        parameterList: ParameterList,
                        closeParenToken: t.CloseParenToken) {
    return new Invocation(expression, openParenToken, parameterList, closeParenToken)
  }

  public constructor (private readonly expression: Expression,
                      private readonly openParenToken: t.OpenParenToken,
                      private readonly parameterList: ParameterList,
                      private readonly closeParenToken: t.CloseParenToken) {
    super()
  }

  public toString () { return `Invocation` }

  public getExpression () { return this.expression }

  public getParameterList () { return this.parameterList }

  public getChildren (): Array<BindingNode> {
    return [
      this.expression,
      this.parameterList,
    ]
  }

  public getStart (): number { return this.expression.getStart() }

  public getEnd (): number { return this.closeParenToken.getEndOrThrow() }

  public getUsedMembers (): Array<Identifier> {
    return [
      ...this.expression.getUsedMembers(),
      ...this.parameterList.getUsedMembers(),
    ]
  }

}

export class ParameterList extends BindingNode {

  @rule(() => [eps])
  public static acceptNothing () {
    return new ParameterList([])
  }

  @rule(() => [Parameter])
  public static acceptSingleParameter (parameter: Parameter) {
    return new ParameterList([parameter])
  }

  @rule(() => [Parameter, t.CommaToken, ParameterList])
  public static acceptRecursive (parameter: Parameter,
                                 comma: t.CommaToken,
                                 parameterList: ParameterList) {
    const parametersFromTheList = parameterList.getParameters()
    return new ParameterList([parameter, ...parametersFromTheList])
  }

  public constructor (private readonly parameters: Array<Parameter>) {
    super()
  }

  public getParameters (): Array<Parameter> {
    return this.parameters
  }

  public toString () {
    return `ParameterList<${ this.getParameters().length }>`
  }

  public getChildren (): Array<BindingNode> { return this.getParameters() }

  public getStart (): number {
    if (this.getParameters().length == 0) return -1 // todo, we need to grab it from epsilon
    return this.getParameters()[0].getStart()
  }

  public getEnd (): number {
    if (this.getParameters().length == 0) return -1 // todo
    return this.getParameters()[this.getParameters().length - 1].getEnd()
  }

  public getUsedMembers (): Array<Identifier> {
    return this.parameters
      .map(parameter => parameter.getUsedMembers())
      .reduce((acc, curr) => [...acc, ...curr])
  }

}

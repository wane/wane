import { rule } from '../../libs/parser/decorators'
import * as t from '../lexer/binding-tokens'
import { eps } from '../../libs/parser/eps'

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

export abstract class AstNode {
  public abstract toString (): string
}

export class ExpressionTree {

  @rule(() => [Expression])
  public static accept (root: Expression) {
    return new ExpressionTree(root)
  }

  constructor (private readonly root: Expression) {
  }

}

export class InvocationTree {

  @rule(() => [Invocation])
  public static accept (root: Invocation) {
    return new InvocationTree(root)
  }

  constructor (private readonly root: Invocation) {
  }

}

export class InterpolationTree {

  @rule(() => [Expression])
  @rule(() => [FormattedExpression])
  public static accept (root: Expression | FormattedExpression) {
    return new InterpolationTree(root)
  }

  constructor (private readonly root: Expression | FormattedExpression) {
  }

}

export class Parameter extends AstNode {

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

  public toString (): string {
    return `ParameterPlaceholder`
  }

}

export abstract class Expression extends Parameter {

  @rule(() => [Identifier])
  @rule(() => [Literal])
  @rule(() => [ElementAccessExpression])
  @rule(() => [PropertyAccessExpression])
  public static acceptIdentifier (concreteExpression: Expression): Expression {
    return concreteExpression
  }

  public toString () {
    return `Expression???`
  }

}

export class Identifier extends Expression {

  @rule(() => [t.IdentifierToken])
  public static acceptIdentifierToken (token: t.IdentifierToken) {
    return new Identifier(token)
  }

  constructor (private token: t.IdentifierToken) {
    super()
  }

  public toString (): string {
    return `Identifier<${ this.token.getData() }>`
  }

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

}

export class NumberLiteral extends Literal {

  @rule(() => [t.NumberLiteralToken])
  public static accept (token: t.NumberLiteralToken) {
    return new NumberLiteral(token)
  }

  public toString (): string {
    return `NumberLiteral<${ this.token.getData() }>`
  }

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

}

export class FormattedExpression extends AstNode {

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
    return `PipeExpression`
  }

}

export class Invocation extends AstNode {

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

  public toString () {
    return `Invocation`
  }

}

export class ParameterList extends AstNode {

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

}

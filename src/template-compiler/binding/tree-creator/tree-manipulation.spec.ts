import 'mocha'
import { assert } from 'chai'
import { InterpolationTree } from './trees'
import * as n from './nodes'
import { BindingNode } from './nodes'
import * as t from '../lexer/binding-tokens'


/**
 * a.b[0] |> p()
 *
 * |>
 *   []
 *     .
 *       a
 *       b
 *     0
 *   ()
 *     p
 *     ... (empty args)
 */
describe(`Traversal`, () => {

  const identifierA = new n.Identifier(new t.IdentifierToken('a'))
  const identifierB = new n.Identifier(new t.IdentifierToken('b'))
  const propertyAccessExpression = new n.PropertyAccessExpression(
    identifierA,
    new t.DotToken(),
    identifierB,
  )

  const literal = new n.NumberLiteral(new t.NumberLiteralToken('0'))

  const elementAccessExpression = new n.ElementAccessExpression(
    propertyAccessExpression,
    new t.OpenSquareBracketToken(),
    literal,
    new t.CloseSquareBracketToken(),
  )

  const identifierP = new n.Identifier(new t.IdentifierToken('p'))
  const parameterList = new n.ParameterList([])
  const invocation = new n.Invocation(
    identifierP,
    new t.OpenParenToken(),
    parameterList,
    new t.CloseParenToken(),
  )

  const formattedExpression = new n.FormattedExpression(
    elementAccessExpression,
    new t.PipeToken(),
    invocation,
  )

  const tree = new InterpolationTree(formattedExpression)

  describe(`forEach`, () => {

    it(`should iterate over all nodes, depth-first`, () => {
      const actual: BindingNode[] = []
      tree.getRoot().forEach(node => actual.push(node))
      const expected: BindingNode[] = [
        formattedExpression,
        elementAccessExpression,
        propertyAccessExpression,
        identifierA,
        identifierB,
        literal,
        invocation,
        identifierP,
        parameterList,
      ]
      assert.sameOrderedMembers(actual, expected)
    })

    it(`should skip children when traverse.skipChildren() is called`, () => {
      const actual: BindingNode[] = []
      tree.getRoot().forEach((node, {skipChildren}) => {
        if (node == propertyAccessExpression) skipChildren()
        else actual.push(node)
      })
      const expected: BindingNode[] = [
        formattedExpression,
        elementAccessExpression,
        literal,
        invocation,
        identifierP,
        parameterList,
      ]
      assert.sameOrderedMembers(actual, expected, actual.map(x => x.toString()).join(' '))
    })

    it(`should stop traversing when traverse.end() is called`, () => {
      const actual: BindingNode[] = []
      tree.getRoot().forEach((node, {end}) => {
        if (node == propertyAccessExpression) end()
        else actual.push(node)
      })
      const expected: BindingNode[] = [
        formattedExpression,
        elementAccessExpression,
      ]
      assert.sameOrderedMembers(actual, expected)
    })

  })

})

/**
 * a.b.z[c.d] |> e.f(g.h) => a, c, e, g
 */
describe(`getUsedMemberNames`, () => {

  const identifierA = new n.Identifier(new t.IdentifierToken('a'))
  const identifierB = new n.Identifier(new t.IdentifierToken('b'))
  const identifierC = new n.Identifier(new t.IdentifierToken('c'))
  const identifierD = new n.Identifier(new t.IdentifierToken('d'))
  const identifierE = new n.Identifier(new t.IdentifierToken('e'))
  const identifierF = new n.Identifier(new t.IdentifierToken('f'))
  const identifierG = new n.Identifier(new t.IdentifierToken('g'))
  const identifierH = new n.Identifier(new t.IdentifierToken('h'))
  const identifierZ = new n.Identifier(new t.IdentifierToken('z'))

  const propertyAccessExpressionAb = new n.PropertyAccessExpression(
    identifierA,
    new t.DotToken(),
    identifierB,
  )
  const propertyAccessExpressionAbz = new n.PropertyAccessExpression(
    propertyAccessExpressionAb,
    new t.DotToken(),
    identifierZ,
  )
  const propertyAccessExpressionCd = new n.PropertyAccessExpression(
    identifierC,
    new t.DotToken(),
    identifierD,
  )
  const elementAccessExpression = new n.ElementAccessExpression(
    propertyAccessExpressionAbz,
    new t.OpenSquareBracketToken(),
    propertyAccessExpressionCd,
    new t.CloseSquareBracketToken(),
  )

  const propertyAccessExpressionEf = new n.PropertyAccessExpression(
    identifierE,
    new t.DotToken(),
    identifierF,
  )
  const propertyAccessExpressionGh = new n.PropertyAccessExpression(
    identifierG,
    new t.DotToken(),
    identifierH,
  )
  const parameterList = new n.ParameterList([propertyAccessExpressionGh])
  const invocation = new n.Invocation(
    propertyAccessExpressionEf,
    new t.OpenParenToken(),
    parameterList,
    new t.CloseParenToken(),
  )

  const formattedExpression = new n.FormattedExpression(
    elementAccessExpression,
    new t.PipeToken(),
    invocation,
  )

  const tree = new InterpolationTree(formattedExpression)

  it(`works`, () => {
    const actual = tree.getUsedMembers()
    const expected = [
      identifierA,
      identifierC,
      identifierE,
      identifierG,
    ]
    assert.sameOrderedMembers(actual, expected)
  })

})

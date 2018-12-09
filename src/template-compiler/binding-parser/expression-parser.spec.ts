import 'mocha'
import { assert } from 'chai'
import { Parser } from '../../libs/parser'
import { WaneTemplateBindingLexer } from '../lexer/binding-lexer'
import { expressionGrammar } from './index'
import * as n from './ast'
import * as t from '../lexer/binding-tokens'

describe(`Binding parser`, () => {

  describe(`Expression parser`, () => {

    const parser = new Parser(expressionGrammar)
    const lexer = new WaneTemplateBindingLexer()

    function doTest (input: string, expression: n.Expression) {
      const actual = parser.parse(lexer.lex(input).toArray()) as any as n.Expression
      assert.deepEqual(actual, expression)
    }

    it(`should parse a single identifier`, () => {
      doTest(`id`, new n.ExpressionTree(
        new n.Identifier(
          new t.IdentifierToken('id').setPos(0, 2),
        ),
      ))
    })

    it(`should parse a single number literal`, () => {
      doTest(`2103`, new n.ExpressionTree(
        new n.NumberLiteral(
          new t.NumberLiteralToken('2103').setPos(0, 4),
        ),
      ))
    })

    it(`should parse a single string literal`, () => {
      doTest(`'abc'`, new n.ExpressionTree(
        new n.StringLiteral(
          new t.StringLiteralToken(`abc`).setPos(0, 5),
        ),
      ))
    })

    describe(`Property Access Expression`, () => {

      it(`should parse a trivial one`, () => {
        doTest(`left.right`, new n.ExpressionTree(
          new n.PropertyAccessExpression(
            new n.Identifier(
              new t.IdentifierToken('left').setPos(0, 4),
            ),
            new t.DotToken().setPos(4, 5),
            new n.Identifier(
              new t.IdentifierToken('right').setPos(5, 10),
            ),
          ),
        ))
      })

      it(`should parse a longer chain`, () => {
        doTest(`one.two.tri`, new n.ExpressionTree(
          new n.PropertyAccessExpression(
            new n.PropertyAccessExpression(
              new n.Identifier(
                new t.IdentifierToken('one').setPos(0, 3),
              ),
              new t.DotToken().setPos(3, 4),
              new n.Identifier(
                new t.IdentifierToken('two').setPos(4, 7),
              ),
            ),
            new t.DotToken().setPos(7, 8),
            new n.Identifier(
              new t.IdentifierToken('tri').setPos(8, 11),
            ),
          ),
        ))
      })
    })

    describe(`Element Access Expression`, () => {

      it(`should parse a trivial one`, () => {
        doTest(`left[1]`, new n.ExpressionTree(
          new n.ElementAccessExpression(
            new n.Identifier(
              new t.IdentifierToken('left').setPos(0, 4),
            ),
            new t.OpenSquareBracketToken().setPos(4, 5),
            new n.NumberLiteral(
              new t.NumberLiteralToken('1').setPos(5, 6),
            ),
            new t.CloseSquareBracketToken().setPos(6, 7),
          ),
        ))
      })

      it(`should parse when index is another identifier`, () => {
        doTest(`left[right]`, new n.ExpressionTree(
          new n.ElementAccessExpression(
            new n.Identifier(
              new t.IdentifierToken('left').setPos(0, 4),
            ),
            new t.OpenSquareBracketToken().setPos(4, 5),
            new n.Identifier(
              new t.IdentifierToken('right').setPos(5, 10),
            ),
            new t.CloseSquareBracketToken().setPos(10, 11),
          ),
        ))
      })

      it(`should parse a longer chain`, () => {
        doTest(`one[two][tri]`, new n.ExpressionTree(
          new n.ElementAccessExpression(
            new n.ElementAccessExpression(
              new n.Identifier(
                new t.IdentifierToken('one').setPos(0, 3),
              ),
              new t.OpenSquareBracketToken().setPos(3, 4),
              new n.Identifier(
                new t.IdentifierToken('two').setPos(4, 7),
              ),
              new t.CloseSquareBracketToken().setPos(7, 8),
            ),
            new t.OpenSquareBracketToken().setPos(8, 9),
            new n.Identifier(
              new t.IdentifierToken('tri').setPos(9, 12),
            ),
            new t.CloseSquareBracketToken().setPos(12, 13),
          ),
        ))
      })

      it(`should parse when index is a complex expression`, () => {
        doTest(`q[w.e[r]]`, new n.ExpressionTree(
          new n.ElementAccessExpression(
            new n.Identifier(
              new t.IdentifierToken('q').setPos(0, 1),
            ),
            new t.OpenSquareBracketToken().setPos(1, 2),
            new n.ElementAccessExpression(
              new n.PropertyAccessExpression(
                new n.Identifier(
                  new t.IdentifierToken('w').setPos(2, 3),
                ),
                new t.DotToken().setPos(3, 4),
                new n.Identifier(
                  new t.IdentifierToken('e').setPos(4, 5),
                ),
              ),
              new t.OpenSquareBracketToken().setPos(5, 6),
              new n.Identifier(
                new t.IdentifierToken('r').setPos(6, 7),
              ),
              new t.CloseSquareBracketToken().setPos(7, 8),
            ),
            new t.CloseSquareBracketToken().setPos(8, 9),
          ),
        ))
      })

    })

  })

})

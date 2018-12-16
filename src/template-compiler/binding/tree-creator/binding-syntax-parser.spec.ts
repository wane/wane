import 'mocha'
import { assert } from 'chai'
import { Parser } from '../../../libs/parser'
import { WaneTemplateBindingLexer } from '../lexer'
import { expressionGrammar, invocationGrammar } from './index'
import * as n from './nodes'
import * as Tree from './trees'
import * as t from '../lexer/binding-tokens'


describe(`Binding parser`, () => {

  describe(`Expression parser`, () => {

    const parser = new Parser(expressionGrammar)
    const lexer = new WaneTemplateBindingLexer()

    function doTest (input: string, expression: Tree.ExpressionTree) {
      const actual = parser.parse(lexer.lex(input).toArray()) as any
      assert.deepEqual(actual, expression)
    }

    it(`should parse a single identifier`, () => {
      doTest(`id`, new Tree.ExpressionTree(
        new n.Identifier(
          new t.IdentifierToken('id').setPos(0, 2),
        ),
      ))
    })

    it(`should parse a single number literal`, () => {
      doTest(`2103`, new Tree.ExpressionTree(
        new n.NumberLiteral(
          new t.NumberLiteralToken('2103').setPos(0, 4),
        ),
      ))
    })

    it(`should parse a single string literal`, () => {
      doTest(`'abc'`, new Tree.ExpressionTree(
        new n.StringLiteral(
          new t.StringLiteralToken(`abc`).setPos(0, 5),
        ),
      ))
    })

    describe(`Property Access Expression`, () => {

      it(`should parse a trivial one`, () => {
        doTest(`left.right`, new Tree.ExpressionTree(
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
        doTest(`one.two.tri`, new Tree.ExpressionTree(
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
        doTest(`left[1]`, new Tree.ExpressionTree(
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
        doTest(`left[right]`, new Tree.ExpressionTree(
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
        doTest(`one[two][tri]`, new Tree.ExpressionTree(
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
        doTest(`q[w.e[r]]`, new Tree.ExpressionTree(
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

  describe(`Invocation parser`, () => {

    const parser = new Parser(invocationGrammar)
    const lexer = new WaneTemplateBindingLexer()

    function doTest (input: string, expression: Tree.InvocationTree) {
      const actual = parser.parse(lexer.lex(input).toArray()) as any
      assert.deepEqual(actual, expression)
    }

    it(`should parse a function call`, () => {
      doTest(`a()`, new Tree.InvocationTree(
        new n.Invocation(
          new n.Identifier(
            new t.IdentifierToken('a').setPos(0, 1),
          ),
          new t.OpenParenToken().setPos(1, 2),
          new n.ParameterList([]),
          new t.CloseParenToken().setPos(2, 3),
        ),
      ))
    })

    it(`should parse a more complex function call with multiple arguments`, () => {
      doTest(`a.b(c, 1, 's', #)`, new Tree.InvocationTree(
        new n.Invocation(
          new n.PropertyAccessExpression(
            new n.Identifier(
              new t.IdentifierToken('a').setPos(0, 1),
            ),
            new t.DotToken().setPos(1, 2),
            new n.Identifier(
              new t.IdentifierToken('b').setPos(2, 3),
            ),
          ),
          new t.OpenParenToken().setPos(3, 4),
          new n.ParameterList([
            new n.Identifier(
              new t.IdentifierToken('c').setPos(4, 5),
            ),
            new n.NumberLiteral(
              new t.NumberLiteralToken('1').setPos(7, 8),
            ),
            new n.StringLiteral(
              new t.StringLiteralToken('s').setPos(10, 13),
            ),
            new n.ParameterPlaceholder(
              new t.PlaceholderArgumentToken().setPos(15, 16),
            ),
          ]),
          new t.CloseParenToken().setPos(16, 17),
        ),
      ))
    })

  })

})

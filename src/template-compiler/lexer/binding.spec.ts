import 'mocha'
import { assert } from 'chai'
import { Tokens } from '../../libs/lexer'
import {
  CloseSquareBracketToken,
  DotToken,
  IdentifierToken,
  NumberLiteralToken,
  OpenSquareBracketToken,
} from './binding-tokens'
import { WaneTemplateBindingLexer } from './binding-lexer'

describe(`Wane Template Binding Syntax Lexer`, () => {

  describe(`Identifier`, () => {

    const lexer = new WaneTemplateBindingLexer()

    it(`tokenizes a single-letter identifier`, () => {
      const actual = lexer.lex(`a`)
      const expected = new Tokens([
        new IdentifierToken('a').setPos(0, 1),
      ])
      assert.deepEqual(actual, expected)
    })

    it(`tokenizes a two-letter identifier`, () => {
      const actual = lexer.lex(`ab`)
      const expected = new Tokens([
        new IdentifierToken('ab').setPos(0, 2),
      ])
    })

    it(`tokenizes an identifier consisting of a letter and a digit`, () => {
      const actual = lexer.lex(`a1`)
      const expected = new Tokens([
        new IdentifierToken(`a1`).setPos(0, 2),
      ])
      assert.deepEqual(actual, expected)
    })

    it(`treats a letter and a digit separated by space as two separate tokens`, () => {
      const actual = lexer.lex(`a 1`)
      const expected = new Tokens([
        new IdentifierToken(`a`).setPos(0, 1),
        new NumberLiteralToken(`1`).setPos(2, 3),
      ])
      assert.deepEqual(actual, expected)
    })

    // TODO
    // This should probably still be tokenized as a binary operator and then the parser
    // should report that using such is disallowed in templates, along with a docs link.
    it(`treats a slash between identifier and number as a minus`, () => {
      const actual = lexer.lex(`a-1`)
      const expected = new Tokens([
        new IdentifierToken(`a`).setPos(0, 1),
        new NumberLiteralToken(`-1`).setPos(1, 3),
      ])
      assert.deepEqual(actual, expected)
    })

    it(`tokenizes dots correctly`, () => {
      const actual = lexer.lex(`a.b.c`)
      const expected = new Tokens([
        new IdentifierToken(`a`).setPos(0, 1),
        new DotToken().setPos(1, 2),
        new IdentifierToken(`b`).setPos(2, 3),
        new DotToken().setPos(3, 4),
        new IdentifierToken(`c`).setPos(4, 5),
      ])
      assert.deepEqual(actual, expected)
    })

    it(`tokenizes square brackets with number inside brackets`, () => {
      const actual = lexer.lex(`a[1]`)
      const expected = new Tokens([
        new IdentifierToken('a').setPos(0, 1),
        new OpenSquareBracketToken().setPos(1, 2),
        new NumberLiteralToken('1').setPos(2, 3),
        new CloseSquareBracketToken().setPos(3, 4),
      ])
      assert.deepEqual(actual, expected)
    })

    it(`tokenizes square brackets with identifier in brackets`, () => {
      const actual = lexer.lex(`a[b]`)
      const expected = new Tokens([
        new IdentifierToken('a').setPos(0, 1),
        new OpenSquareBracketToken().setPos(1, 2),
        new IdentifierToken('b').setPos(2, 3),
        new CloseSquareBracketToken().setPos(3, 4),
      ])
      assert.deepEqual(actual, expected)
    })

  })

  describe(`Numbers`, () => {

    function doTest (input: string, radix?: 10 | 2 | 8 | 16) {
      const lexer = new WaneTemplateBindingLexer()
      const actual = lexer.lex(input)
      const token = new NumberLiteralToken(input).setPos(0, input.length)
      if (radix != null) token.declareRadix(radix)
      const expected = new Tokens([token])
      assert.deepEqual(actual, expected)
    }

    it(`tokenizes a single-digit number`, () => {
      doTest('1')
    })

    it(`tokenizes zero`, () => {
      doTest(`0`)
    })

    it(`tokenizes a double-digit number`, () => {
      doTest(`21`)
    })

    it(`tokenizes a signed (+) number`, () => {
      doTest(`+21`)
    })

    it(`tokenizes a signed (-) number`, () => {
      doTest(`-21`)
    })

    it(`tokenizes a fraction`, () => {
      doTest(`2.1`)
    })

    it(`tokenizes scientific unsigned notation`, () => {
      doTest(`2e1`)
    })

    it(`tokenizes scientific signed (+) notation`, () => {
      doTest(`2e+1`)
    })

    it(`tokenizes scientific signed (-) notation`, () => {
      doTest(`2e-1`)
    })

    it(`tokenizes decimal starting with zero`, () => {
      doTest(`0.21`)
    })

    it(`tokenizes decimal starting with a period`, () => {
      doTest(`.21`)
    })

    it(`tokenizes a signed decimal starting with a period`, () => {
      doTest(`-.21`)
    })

    it(`tokenizes implicit octal numbers`, () => {
      doTest(`01234567`, 8)
    })

    it(`tokenizes binary numbers`, () => {
      doTest(`0b01`, 2)
    })

    it(`tokenizes explicit octal numbers`, () => {
      doTest(`0o01234567`, 8)
    })

    it(`tokenizes hexadecimal numbers`, () => {
      doTest(`0x0123456789abcdefABCDEF`, 16)
    })

  })

})

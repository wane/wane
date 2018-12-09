import 'mocha'
import { assert } from 'chai'
import * as tags from 'common-tags'
import { EndOfFileToken, Tokens } from '../../libs/lexer'
import { CharacterToken, EndTagToken, InterpolationToken, StartTagToken } from './markup-tokens'
import { WaneTemplateMarkupLexer } from './markup-lexer'

describe(`Template Lexer`, () => {

  const lexer = new WaneTemplateMarkupLexer()

  describe(`Data`, () => {

    it(`tokenizes simple string`, () => {
      const actual = lexer.lex(`ab`)
      const expected = new Tokens([
        new CharacterToken(`a`).setStart(0).setEnd(1),
        new CharacterToken(`b`).setStart(1).setEnd(2),
        new EndOfFileToken().setStart(2).setEnd(2),
      ])
      assert.deepEqual(actual, expected)
    })

  })

  describe(`Interpolation`, () => {

    it(`tokenizes interpolation in the middle`, () => {
      const actual = lexer.lex(`a{{b}}c`)
      const expected = new Tokens([
        new CharacterToken(`a`).setStart(0).setEnd(1),
        new InterpolationToken(`b`).setStart(1).setEnd(6),
        new CharacterToken(`c`).setStart(6).setEnd(7),
        new EndOfFileToken().setStart(7).setEnd(7),
      ])
      assert.deepEqual(actual, expected)
    })

    it(`tokenizes interpolation at start`, () => {
      const actual = lexer.lex(`{{a}}b`)
      const expected = new Tokens([
        new InterpolationToken(`a`).setStart(0).setEnd(5),
        new CharacterToken(`b`).setStart(5).setEnd(6),
        new EndOfFileToken().setStart(6).setEnd(6),
      ])
      assert.deepEqual(actual, expected)
    })

    it(`tokenizes interpolation at end`, () => {
      const actual = lexer.lex(`a{{b}}`)
      const expected = new Tokens([
        new CharacterToken(`a`).setStart(0).setEnd(1),
        new InterpolationToken(`b`).setStart(1).setEnd(6),
        new EndOfFileToken().setStart(6).setEnd(6),
      ])
      assert.deepEqual(actual, expected)
    })

    it(`tokenizes two consecutive interpolations`, () => {
      const actual = lexer.lex(`{{a}}{{b}}`)
      const expected = new Tokens([
        new InterpolationToken(`a`).setStart(0).setEnd(5),
        new InterpolationToken(`b`).setStart(5).setEnd(10),
        new EndOfFileToken().setStart(10).setEnd(10),
      ])
    })

  })

  describe(`Simple tags`, () => {

    it(`tokenizes a single opening tag`, () => {
      const actual = lexer.lex(`<a>`)
      const expected = new Tokens([
        new StartTagToken(`a`).setStart(0).setEnd(3),
        new EndOfFileToken().setStart(3).setEnd(3),
      ])
      assert.deepEqual(actual, expected)
    })

    it(`tokenizes a single closing tag`, () => {
      const actual = lexer.lex(`</a>`)
      const expected = new Tokens([
        new EndTagToken(`a`).setStart(0).setEnd(4),
        new EndOfFileToken().setStart(4).setEnd(4),
      ])
      assert.deepEqual(actual, expected)
    })

    it(`tokenizes two consecutive tags`, () => {
      const actual = lexer.lex(`<a></b>`)
      const expected = new Tokens([
        new StartTagToken(`a`).setStart(0).setEnd(3),
        new EndTagToken(`b`).setStart(3).setEnd(7),
        new EndOfFileToken().setStart(7).setEnd(7),
      ])
      assert.deepEqual(actual, expected)
    })

    it(`tokenizes tags with data between`, () => {
      const actual = lexer.lex(`<a>b</c>`)
      const expected = new Tokens([
        new StartTagToken(`a`).setStart(0).setEnd(3),
        new CharacterToken(`b`).setStart(3).setEnd(4),
        new EndTagToken(`c`).setStart(4).setEnd(8),
        new EndOfFileToken().setStart(8).setEnd(8),
      ])
      assert.deepEqual(actual, expected)
    })

  })

  describe(`Attributes`, () => {

    describe(`Plain attributes`, () => {

      it(`tokenizes a single boolean attribute`, () => {
        const actual = lexer.lex(`<a b>`)

        const tagA = new StartTagToken('a').setStart(0).setEnd(5)
        tagA.startNewPlainAttribute().appendToName('b')
        const expected = new Tokens([
          tagA,
          new EndOfFileToken().setStart(5).setEnd(5),
        ])

        assert.deepEqual(actual, expected)
      })

      it(`tokenizes a single attribute with a value`, () => {
        const actual = lexer.lex(`<a b="c">`)

        const tagA = new StartTagToken('a').setStart(0).setEnd(9)
        tagA.startNewPlainAttribute().appendToName('b').appendToValue('c')
        const expected = new Tokens([
          tagA,
          new EndOfFileToken().setStart(9).setEnd(9),
        ])

        assert.deepEqual(actual, expected)
      })

      it(`tokenizes a single attribute with a value, bound with []`, () => {
        const actual = lexer.lex(`<a [b]="c">`)
        const expected = new Tokens([
          (() => {
            const tag = new StartTagToken('a').setStart(0).setEnd(11)
            tag.startNewExpressionAttribute().appendToName('b').appendToValue('c')
            return tag
          })(),
          new EndOfFileToken().setStart(11).setEnd(11),
        ])

        assert.deepEqual(actual, expected)
      })

      it(`tokenizes a single attribute with a value, bound with ()`, () => {
        const actual = lexer.lex(`<a (b)="c">`)

        const tagA = new StartTagToken('a').setStart(0).setEnd(11)
        tagA.startNewInvocationAttribute().appendToName('b').appendToValue('c')
        const expected = new Tokens([
          tagA,
          new EndOfFileToken().setStart(11).setEnd(11),
        ])

        assert.deepEqual(actual, expected)
      })

      it(`tokenizes all three types of attributes in a row`, () => {
        const actual = lexer.lex(`<a b="c" [d]="e" (f)="g">`)

        const tagA = new StartTagToken('a').setStart(0).setEnd(25)
        tagA.startNewPlainAttribute().appendToName('b').appendToValue('c')
        tagA.startNewExpressionAttribute().appendToName('d').appendToValue('e')
        tagA.startNewInvocationAttribute().appendToName('f').appendToValue('g')
        const expected = new Tokens([
          tagA,
          new EndOfFileToken().setStart(25).setEnd(25),
        ])

        assert.deepEqual(actual, expected)
      })

    })

  })

  describe(`Real world`, () => {

    it(`tokenizes a sample "hello, bound-name" program`, () => {
      const actual = lexer.lex(tags.stripIndent`
        <label>
          <span>Name</span>
          <input type="text" [value]="name" (input)="onChange(#)">
        </label>
        <span>Hello, <b>{{ name }}</b></span>
      `)

      const expected = new Tokens([
        new StartTagToken('label').setStart(0).setEnd(7),
        new CharacterToken('\n').setStart(7).setEnd(8),
        new CharacterToken(' ').setStart(8).setEnd(9),
        new CharacterToken(' ').setStart(9).setEnd(10),
        new StartTagToken('span').setStart(10).setEnd(16),
        new CharacterToken(`N`).setStart(16).setEnd(17),
        new CharacterToken(`a`).setStart(17).setEnd(18),
        new CharacterToken(`m`).setStart(18).setEnd(19),
        new CharacterToken(`e`).setStart(19).setEnd(20),
        new EndTagToken('span').setStart(20).setEnd(27),
        new CharacterToken('\n').setStart(27).setEnd(28),
        new CharacterToken(' ').setStart(28).setEnd(29),
        new CharacterToken(' ').setStart(29).setEnd(30),
        (() => {
          const input = new StartTagToken('input').setStart(30).setEnd(86)
          input.startNewPlainAttribute().appendToName('type').appendToValue('text')
          input.startNewExpressionAttribute().appendToName('value').appendToValue('name')
          input.startNewInvocationAttribute().appendToName('input').appendToValue('onChange(#)')
          return input
        })(),
        new CharacterToken('\n').setStart(86).setEnd(87),
        new EndTagToken('label').setStart(87).setEnd(95),
        new CharacterToken('\n').setStart(95).setEnd(96),
        new StartTagToken('span').setStart(96).setEnd(102),
        new CharacterToken('H').setStart(102).setEnd(103),
        new CharacterToken('e').setStart(103).setEnd(104),
        new CharacterToken('l').setStart(104).setEnd(105),
        new CharacterToken('l').setStart(105).setEnd(106),
        new CharacterToken('o').setStart(106).setEnd(107),
        new CharacterToken(',').setStart(107).setEnd(108),
        new CharacterToken(' ').setStart(108).setEnd(109),
        new StartTagToken('b').setStart(109).setEnd(112),
        new InterpolationToken(' name ').setStart(112).setEnd(122),
        new EndTagToken('b').setStart(122).setEnd(126),
        new EndTagToken('span').setStart(126).setEnd(133),
        new EndOfFileToken().setStart(133).setEnd(133),
      ])
      assert.deepEqual(actual, expected)
    })

  })

})

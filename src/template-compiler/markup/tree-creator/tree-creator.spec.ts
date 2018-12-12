import 'mocha'
import { assert } from 'chai'
import { EndOfFileToken, Tokens } from '../../../libs/lexer'
import {
  CharacterToken,
  EndTagToken,
  MarkupToken,
  StartTagToken,
  InterpolationToken,
} from '../lexer'
import {
  WtmlElementNode,
  WtmlPhantomRootNode,
  WtmlTextNode,
  WtmlInterpolationNode,
} from './wtml-nodes'
import { TreeCreator } from './tree-creator'
import { TagNamesLists } from './lists'


describe(`TreeCreator`, () => {

  function doTest (tokens: Array<MarkupToken>,
                   expected: WtmlPhantomRootNode,
                   lists: TagNamesLists = new TagNamesLists()) {
    const treeCreator = new TreeCreator(lists)
    const actual = treeCreator.createTree(tokens)
    assert.deepEqual(actual, expected)
  }

  /**
   * Hello
   */
  it(`should construct a single text node`, () => {
    doTest([
      new CharacterToken(`H`).setPos(0, 1),
      new CharacterToken(`e`).setPos(1, 2),
      new CharacterToken(`l`).setPos(2, 3),
      new CharacterToken(`l`).setPos(3, 4),
      new CharacterToken(`o`).setPos(4, 5),
      new EndOfFileToken(),
    ], new WtmlPhantomRootNode().addChildren(
      new WtmlTextNode(`Hello`).setPos(0, 5),
    ))
  })

  /**
   * <a>t</a>
   */
  it(`should construct text wrapped in tags`, () => {
    const startA = new StartTagToken('a').setPos(0, 3)
    const endA = new EndTagToken('a').setPos(4, 8)
    doTest(
      [
        startA,
        new CharacterToken(`t`).setPos(3, 4),
        endA,
        new EndOfFileToken(),
      ],
      new WtmlPhantomRootNode().addChildren(
        new WtmlElementNode(startA).addChildren(
          new WtmlTextNode(`t`).setPos(3, 4),
        ).registerEndTagToken(endA),
      ),
    )
  })

  /**
   * <a>1</a>2<b>3</b>
   */
  it(`should construct two elements with text between`, () => {
    const startA = new StartTagToken('a').setPos(0, 3)
    const endA = new EndTagToken('a').setPos(4, 8)
    const startB = new StartTagToken('b').setPos(9, 12)
    const endB = new EndTagToken('b').setPos(13, 17)
    doTest(
      [
        startA,
        new CharacterToken('1').setPos(3, 4),
        endA,
        new CharacterToken('2').setPos(8, 9),
        startB,
        new CharacterToken('3').setPos(12, 13),
        endB,
        new EndOfFileToken(),
      ],
      new WtmlPhantomRootNode().addChildren(
        new WtmlElementNode(startA).addChildren(
          new WtmlTextNode(`1`).setPos(3, 4),
        ).registerEndTagToken(endA),
        new WtmlTextNode(`2`).setPos(8, 9),
        new WtmlElementNode(startB).addChildren(
          new WtmlTextNode(`3`).setPos(12, 13),
        ).registerEndTagToken(endB),
      ),
    )
  })

  /**
   * <a>l<b>m</b>r</a>
   */
  it(`should construct nested elements`, () => {
    const startA = new StartTagToken('a').setPos(0, 3)
    const startB = new StartTagToken('b').setPos(4, 7)
    const endB = new EndTagToken('b').setPos(8, 12)
    const endA = new EndTagToken('a').setPos(13, 17)
    doTest(
      [
        startA,
        new CharacterToken('l').setPos(3, 4),
        startB,
        new CharacterToken('m').setPos(7, 8),
        endB,
        new CharacterToken('r').setPos(12, 13),
        endA,
      ],
      new WtmlPhantomRootNode().addChildren(
        new WtmlElementNode(startA).addChildren(
          new WtmlTextNode('l').setPos(3, 4),
          new WtmlElementNode(startB).addChildren(
            new WtmlTextNode('m').setPos(7, 8),
          ).registerEndTagToken(endB),
          new WtmlTextNode('r').setPos(12, 13),
        ).registerEndTagToken(endA),
      ),
    )
  })

  /**
   * {{i}}
   */
  it(`should construct interpolation`, () => {
    const i = new InterpolationToken('i').setPos(0, 5)
    doTest(
      [
        i,
      ],
      new WtmlPhantomRootNode().addChildren(
        WtmlInterpolationNode.Create(i),
      ),
    )
  })

  /**
   * {{a}}t{{b}}
   */
  it(`should construct two interpolation nodes with text between`, () => {
    const a = new InterpolationToken('a').setPos(0, 5)
    const b = new InterpolationToken('b').setPos(6, 11)
    doTest(
      [
        a,
        new CharacterToken('t').setPos(5, 6),
        b,
      ],
      new WtmlPhantomRootNode().addChildren(
        WtmlInterpolationNode.Create(a),
        new WtmlTextNode('t').setPos(5, 6),
        WtmlInterpolationNode.Create(b),
      ),
    )
  })

  /**
   * <a/>
   */
  it(`should construct a single self-closing tag`, () => {
    const a = new StartTagToken('a').setPos(0, 4).declareSelfClosing()
    doTest(
      [
        a,
      ],
      new WtmlPhantomRootNode().addChildren(
        new WtmlElementNode(a),
      ),
    )
  })

  /**
   * <a b="c">
   */
  it(`should construct a tag with attributes`, () => {
    const lists = new TagNamesLists().addElementWithOnlyOpeningTag('a')
    const treeCreator = new TreeCreator(lists)

    const tagToken = new StartTagToken('a').setStart(0).setEnd(9)
    tagToken.startNewPlainAttribute().appendToName('b').appendToValue('c')

    const tokens = new Tokens([
      tagToken,
      new EndOfFileToken().setStart(9).setEnd(9),
    ])

    const actual = treeCreator.createTree(tokens.toArray())

    const elementNode = new WtmlElementNode(tagToken)
    const expected = new WtmlPhantomRootNode().addChildren(elementNode)

    assert.deepEqual(actual, expected)
    const actualElementNode = actual.findElementOrThrow('a')
    assert.lengthOf(actualElementNode.getAttributes(), 1)

    const attribute = actualElementNode.getPlainAttributeOrThrow('b')
    assert.equal(attribute.getValue(), 'c')
  })

})

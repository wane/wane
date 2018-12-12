import { Stack } from '../../../libs/stack'
import { EndOfFileToken } from '../../../libs/lexer'
import {
  CharacterToken,
  CommentToken,
  EndTagToken,
  InterpolationToken,
  MarkupToken,
  StartTagToken,
} from '../lexer'
import {
  WtmlElementNode,
  WtmlInterpolationNode,
  WtmlNode,
  WtmlPhantomRootNode,
  WtmlTextNode,
} from './wtml-nodes'
import { TagNamesLists } from './lists'


export class TreeCreator {

  protected root!: WtmlPhantomRootNode

  protected stack = new Stack<WtmlNode>()

  protected getCurrentNode<T extends WtmlNode> () {
    return this.stack.peek<T>()
  }

  private collectedTextStart: number | null = null
  private collectedText: string = ''

  private previousToken: MarkupToken | null = null

  constructor (protected lists: TagNamesLists = new TagNamesLists()) {
    this.reset()
  }

  public createTree (tokens: Array<MarkupToken>) {
    for (const token of tokens) this.processToken(token)
    const result = this.root
    this.reset()
    return result
  }

  protected reset () {
    this.root = new WtmlPhantomRootNode()
    this.stack.reset()
    this.collectedTextStart = null
    this.collectedText = ''
    this.previousToken = null
    this.stack.push(this.root)
  }

  protected processToken (token: MarkupToken) {
    if (token instanceof CharacterToken) {
      this.handleCharacterToken(token)
    } else {
      this.finalizeCollectedText()
      if (token instanceof StartTagToken) {
        this.handleStartTagToken(token)
      } else if (token instanceof EndTagToken) {
        this.handleEndTagToken(token)
      } else if (token instanceof CommentToken) {
        this.handleCommentToken(token)
      } else if (token instanceof InterpolationToken) {
        this.handleInterpolationToken(token)
      } else if (token instanceof EndOfFileToken) {
        this.handleEndOfFileToken(token)
      } else {
        throw new Error(`Unknown token type.`)
      }
    }
    this.previousToken = token
  }

  /**
   * Accumulate to existing text data or start it.
   */
  protected handleCharacterToken (token: CharacterToken) {
    this.collectedText += token.getData()
    if (this.collectedTextStart == null) {
      this.collectedTextStart = token.getStartOrThrow()
    }
  }

  /**
   * Handle collected characters for a Text node since we've encountered
   * a token which is not a Character token. Prepare for the text time
   * we encounter a character.
   */
  protected finalizeCollectedText () {
    if (this.collectedTextStart != null) {
      const textEl = new WtmlTextNode(this.collectedText)
        .setPos(this.collectedTextStart, this.previousToken!.getEndOrThrow())
      this.getCurrentNode<WtmlElementNode>().addChildren(textEl)
      this.collectedText = ''
      this.collectedTextStart = null
    }
  }

  protected handleStartTagToken (token: StartTagToken) {
    const tagName = token.getTagName()

    const element = WtmlElementNode.Create(token, this.lists)
    this.getCurrentNode<WtmlElementNode>().addChildren(element)

    const isElementDone = token.isSelfClosing() || this.lists.elementsWithOnlyOpeningTag.includes(tagName)
    if (!isElementDone) this.stack.push(element)
  }

  protected handleEndTagToken (token: EndTagToken) {
    const popped = this.stack.pop()
    if (!(popped instanceof WtmlElementNode)) {
      throw new Error(`Unexpected closing tag </${ token.getTagName() }> at ${ token.printPos() }.`)
    }
    const poppedTagName = popped.getTagName()
    if (token.getTagName() != poppedTagName) {
      throw new Error(`Expected closing tag for <${ poppedTagName }>, but found </${ token.getTagName() }> at ${ token.printPos() }`)
    }
    popped.registerEndTagToken(token)
  }

  protected handleCommentToken (token: CommentToken) {
    // Ignore.
  }

  protected handleInterpolationToken (token: InterpolationToken) {
    const interpolation = WtmlInterpolationNode.Create(token)
    this.getCurrentNode<WtmlElementNode>().addChildren(interpolation)
  }

  protected handleEndOfFileToken (token: EndOfFileToken) {
    if (this.getCurrentNode() != this.root) {
      const current = this.getCurrentNode() as WtmlElementNode
      throw new Error(`No matching closing tag found for ${ current.getTagName() } at ${ current.printPos() }.`)
    }
  }

}

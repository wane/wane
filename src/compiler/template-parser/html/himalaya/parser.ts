import { arrayIncludes } from './compat'
import * as himalaya from './types'
import { NodeType } from './types'
import {
  LexState,
  Token,
  TokenAttribute,
  TokenTag,
  TokenTagEnd,
  TokenTagStart,
  TokenType,
} from './tokens'

export interface ParseState {
  tokens: LexState['tokens']
  options: Partial<himalaya.Options>
  cursor: number
  stack: StackItem[]
}

export interface StackItem {
  tagName: string
  children: StackItem[]
  position: {
    start: himalaya.Position,
    end: himalaya.Position,
  }
}

export default function parser (tokens: LexState['tokens'],
                                options: Partial<himalaya.Options>): StackItem[] {
  const root = { tagName: null, children: [] } as any as StackItem
  const state: ParseState = { tokens, options, cursor: 0, stack: [root] }
  parse(state)
  return root.children
}

export function hasTerminalParent (tagName: string,
                                   stack: ParseState['stack'],
                                   terminals: Record<string, string[]>): boolean {
  const tagParents = terminals[tagName]
  if (tagParents) {
    let currentIndex = stack.length - 1
    while (currentIndex >= 0) {
      const parentTagName = stack[currentIndex].tagName
      if (parentTagName === tagName) {
        break
      }
      if (arrayIncludes(tagParents, parentTagName)) {
        return true
      }
      currentIndex--
    }
  }
  return false
}

export function rewindStack (stack: ParseState['stack'],
                             newLength: number,
                             childrenEndPosition: himalaya.Position,
                             endPosition: himalaya.Position): void {
  stack[newLength].position.end = endPosition
  for (let i = newLength + 1, len = stack.length; i < len; i++) {
    stack[i].position.end = childrenEndPosition
  }
  stack.splice(newLength)
}

export function parse (state: ParseState) {
  const { tokens, options, stack } = state
  let nodes = stack[stack.length - 1].children
  const len = tokens.length
  let { cursor } = state
  while (cursor < len) {
    const token = tokens[cursor]
    if (token.type !== TokenType.TagStart) {
      nodes.push(token as any)
      cursor++
      continue
    }

    const tagToken = tokens[++cursor] as Exclude<Token, TokenTagStart | TokenTagEnd>
    cursor++
    const tagName = tagToken.content
    if (token.close) {
      let index = stack.length
      let shouldRewind = false
      while (--index > -1) {
        if (stack[index].tagName === tagName) {
          shouldRewind = true
          break
        }
      }
      while (cursor < len) {
        const endToken = tokens[cursor]
        if (endToken.type !== TokenType.TagEnd) break
        cursor++
      }
      if (shouldRewind) {
        const prevToken = tokens[cursor - 1] as Exclude<Token, TokenTag | TokenAttribute | TokenTagStart | TokenTagEnd>
        rewindStack(stack, index, token.position.start, prevToken.position.end)
        break
      } else {
        continue
      }
    }

    const isClosingTag = arrayIncludes(options.closingTags || [], tagName)
    let shouldRewindToAutoClose = isClosingTag
    if (shouldRewindToAutoClose) {
      const { closingTagAncestorBreakers: terminals } = options
      shouldRewindToAutoClose = !hasTerminalParent(tagName, stack, terminals || {})
    }

    if (shouldRewindToAutoClose) {
      // rewind the stack to just above the previous
      // closing tag of the same name
      let currentIndex = stack.length - 1
      while (currentIndex > 0) {
        if (tagName === stack[currentIndex].tagName) {
          rewindStack(stack, currentIndex, token.position.start, token.position.start)
          const previousIndex = currentIndex - 1
          nodes = stack[previousIndex].children
          break
        }
        currentIndex = currentIndex - 1
      }
    }

    let attributes = []
    let attrToken: TokenAttribute
    while (cursor < len) {
      attrToken = tokens[cursor] as TokenAttribute
      if (attrToken.type  as any === TokenType.TagEnd) break
      attributes.push((attrToken as TokenAttribute).content)
      cursor++
    }

    cursor++
    const children: himalaya.NodeElement['children'] = []
    const position = {
      start: token.position.start,
      // @ts-ignore
      end: attrToken!.position.end,
    }
    // @ts-ignore
    const elementNode: himalaya.NodeElement = {
      type: NodeType.Element,
      tagName: tagToken.content,
      attributes,
      children,
      position,
    }
    // @ts-ignore
    nodes.push(elementNode)

    // @ts-ignore
    const hasChildren = !(attrToken.close || arrayIncludes(options.voidTags, tagName))
    if (hasChildren) {
      // @ts-ignore
      const size = stack.push({ tagName, children, position })
      const innerState = { tokens, options, cursor, stack }
      parse(innerState)
      cursor = innerState.cursor
      const rewoundInElement = stack.length === size
      if (rewoundInElement) {
        // @ts-ignore
        elementNode.position.end = tokens[cursor - 1].position.end
      }
    }
  }
  state.cursor = cursor
}

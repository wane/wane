import * as himalaya from './types'

export interface PositionStart {
  start: himalaya.Position
}

export interface PositionEnd {
  end: himalaya.Position
}

export type Position = PositionStart & PositionEnd

export const enum TokenType {
  Tag = 'tag',
  TagStart = 'tag-start',
  TagEnd = 'tag-end',
  Text = 'text',
  Comment = 'comment',
  Attribute = 'attribute',
}

export interface TokenTag {
  type: TokenType.Tag
  content: string
}

export interface TokenTagStart {
  type: TokenType.TagStart
  close: boolean
  position: PositionStart
}

export interface TokenTagEnd {
  type: TokenType.TagEnd
  close: boolean
  position: PositionEnd
}

export interface TokenText {
  type: TokenType.Text
  content: string
  position: Position
}

export interface TokenComment {
  type: TokenType.Comment
  content: string
  position: Position
}

export interface TokenAttribute {
  type: TokenType.Attribute
  content: string
}

export type Token = TokenTag | TokenTagStart | TokenTagEnd | TokenText | TokenComment | TokenAttribute

export interface LexState {
  str: string
  position: himalaya.Position
  tokens: Token[]
}

export interface LexStateWithOptions extends LexState {
  options: Partial<himalaya.Options>
}

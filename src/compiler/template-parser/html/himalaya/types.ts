export interface Options {
  voidTags: string[],
  closingTags: string[],
  childlessTags: string[],
  closingTagAncestorBreakers: Record<string, string[]>,
  includePositions: boolean
}

export interface Position {
  index: number
  line: number
  column: number
}

export interface Attribute {
  key: string
  value: string | null
}

export const enum NodeType {
  Element = 'element',
  Text = 'text',
  Comment = 'comment',
}

export interface NodeElement {
  type: NodeType.Element
  tagName: string
  attributes: Attribute[]
  children: Node[]
  position?: {
    start: Position,
    end: Position,
  }
}

export interface NodeText {
  type: NodeType.Text,
  content: string
  position?: {
    start: Position,
    end: Position,
  }
}

export interface NodeComment {
  type: NodeType.Comment,
  content: string
  position?: {
    start: Position,
    end: Position,
  }
}

export type Node = NodeElement | NodeText | NodeComment

export type Ast = Node[]

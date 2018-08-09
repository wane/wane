import * as himalaya from './types'

export interface InternalNodeElement {
  type: himalaya.NodeType.Element
  tagName: string
  attributes: string[]
  children: InternalNode[]
  position: {
    start: himalaya.Position,
    end: himalaya.Position,
  }
}

export interface InternalNodeText {
  type: himalaya.NodeType.Text
  content: string
  position: {
    start: himalaya.Position,
    end: himalaya.Position,
  }
}

export interface InternalNodeComment {
  type: himalaya.NodeType.Comment
  content: string
  position: {
    start: himalaya.Position,
    end: himalaya.Position,
  }
}

export type InternalNode = InternalNodeElement | InternalNodeText | InternalNodeComment

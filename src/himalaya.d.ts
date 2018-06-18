declare module 'himalaya' {

  interface PosInfo {
    index: number
    line: number
    column: number
  }

  interface Position {
    start: PosInfo
    end: PosInfo
  }

  type Type = 'element' | 'comment' | 'text'

  interface NodeBase {
    type: Type
  }

  interface NodeBaseWithPosition extends NodeBase {
    position: Position
  }

  type Node = Element | Comment | Text

  interface Element extends NodeBaseWithPosition {
    type: 'element'
    tagName: string
    children: Node[]
    attributes: Attribute[]
  }

  interface Attribute {
    key: string
    value: string | null
  }

  interface Comment extends NodeBaseWithPosition {
    type: 'comment'
    content: string
  }

  interface Text extends NodeBaseWithPosition {
    type: 'text'
    content: string
  }

  function parse (html: string, options: Object): Node[]

  function stringify (nodes: Node[]): string

  const parseDefaults: Object

}

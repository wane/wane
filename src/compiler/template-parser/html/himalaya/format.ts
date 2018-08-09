import * as himalaya from './types'
import {InternalNode} from './private-types'

export function splitHead (str: string, sep: string): [string] | [string, string] {
  const idx = str.indexOf(sep)
  if (idx === -1) return [str]
  return [str.slice(0, idx), str.slice(idx + sep.length)]
}

export function unquote (str: string): string {
  const car = str.charAt(0)
  const end = str.length - 1
  const isQuoteStart = car === '"' || car === "'"
  if (isQuoteStart && car === str.charAt(end)) {
    return str.slice(1, end)
  }
  return str
}

export function format (nodes: Array<InternalNode>, options: himalaya.Options): Array<himalaya.Node> {
  return nodes.map(node => {
    const outputNode = node.type === himalaya.NodeType.Element
      ? {
        type: node.type,
        tagName: node.tagName,
        attributes: formatAttributes(node.attributes),
        children: format(node.children, options)
      } as himalaya.NodeElement
      : { type: node.type, content: node.content } as himalaya.NodeComment | himalaya.NodeText
    if (options.includePositions) {
      outputNode.position = node.position
    }
    return outputNode
  })
}

export function formatAttributes (attributes: string[]): himalaya.Attribute[] {
  return attributes.map(attribute => {
    const parts = splitHead(attribute.trim(), '=')
    const key = parts[0]
    const value = typeof parts[1] === 'string'
      ? unquote(parts[1])
      : null
    return {key, value}
  })
}

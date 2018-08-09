import {arrayIncludes} from './compat'
import * as himalaya from './types'

export function formatAttributes (attributes: Array<himalaya.Attribute>) {
  return attributes.reduce((attrs, attribute) => {
    const {key, value} = attribute
    if (value === null) {
      return `${attrs} ${key}`
    }
    const quoteEscape = value.indexOf('\'') !== -1
    const quote = quoteEscape ? '"' : '\''
    return `${attrs} ${key}=${quote}${value}${quote}`
  }, '')
}

export function toHTML (ast: himalaya.Ast, options: himalaya.Options): string {
  return ast.map(node => {
    switch (node.type) {
      case himalaya.NodeType.Text:
        return node.content
      case himalaya.NodeType.Comment:
        return `<!--${node.content}-->`
      case himalaya.NodeType.Element:
        const {tagName, attributes, children} = node
        const isSelfClosing = arrayIncludes(options.voidTags, tagName)
        return isSelfClosing
          ? `<${tagName}${formatAttributes(attributes)}>`
          : `<${tagName}${formatAttributes(attributes)}>${toHTML(children, options)}</${tagName}>`
    }
  }).join('')
}

export default {toHTML}

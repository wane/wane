import lexer from './lexer'
import parser from './parser'
import { format } from './format'
import { toHTML } from './stringify'
import { childlessTags, closingTagAncestorBreakers, closingTags, voidTags } from './tags'
import * as himalaya from './types'

export * from './types'

export const parseDefaults: himalaya.Options = {
  voidTags,
  closingTags,
  childlessTags,
  closingTagAncestorBreakers,
  includePositions: false,
}

export function parse (str: string,
                       options: Partial<himalaya.Options> = parseDefaults): himalaya.Ast {
  const tokens = lexer(str, options)
  const nodes = parser(tokens, options)
  // @ts-ignore
  return format(nodes, options)
}

export function stringify (ast: himalaya.Ast,
                           options: himalaya.Options = parseDefaults): string {
  return toHTML(ast, options)
}

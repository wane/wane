import { WtmlPhantomRootNode } from './markup/tree-creator/wtml-nodes'
import { WaneTemplateMarkupLexer } from './markup/lexer'
import { TreeCreator } from './markup/tree-creator/tree-creator'


const lexer = new WaneTemplateMarkupLexer()
const treeCreator = new TreeCreator()

export function parseTemplate (template: string): WtmlPhantomRootNode {
  const tokens = lexer.lex(template).toArray()
  return treeCreator.createTree(tokens)
}
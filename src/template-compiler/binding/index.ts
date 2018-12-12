import { Parser } from '../../libs/parser'
import { WaneTemplateBindingLexer } from './lexer'
import {
  expressionGrammar,
  invocationGrammar,
  interpolationGrammar,
  ExpressionTree,
  InvocationTree,
  InterpolationTree,
} from './tree-creator'


const bindingLexer = new WaneTemplateBindingLexer()

function parseBinding<T> (input: string, parser: Parser): T {
  const tokens = bindingLexer.lex(input).toArray()
  const root = parser.parse(tokens)
  return root as unknown as T
}

const expressionTreeParser = new Parser(expressionGrammar)
const invocationTreeParser = new Parser(invocationGrammar)
const interpolationTreeParser = new Parser(interpolationGrammar)

export function parseExpression (input: string): ExpressionTree {
  return parseBinding<ExpressionTree>(input, expressionTreeParser)
}

export function parseInvocation (input: string): InvocationTree {
  return parseBinding<InvocationTree>(input, invocationTreeParser)
}

export function parseInterpolation (input: string): InterpolationTree {
  return parseBinding<InterpolationTree>(input, interpolationTreeParser)
}

export {
  ExpressionTree,
  InvocationTree,
  InterpolationTree,
}
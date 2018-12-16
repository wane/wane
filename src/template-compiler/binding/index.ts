import { Parser } from '../../libs/parser'
import { WaneTemplateBindingLexer } from './lexer'
import {
  expressionGrammar,
  invocationGrammar,
  interpolationGrammar,
  conditionalExpressionGrammar,
  repeatingInstructionGrammar,
  ExpressionTree,
  InvocationTree,
  InterpolationTree,
  ConditionalExpressionTree,
  RepeatingInstructionTree,
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
const conditionalExpressionTreeParser = new Parser(conditionalExpressionGrammar)
const repeatingInstructionTreeParser = new Parser(repeatingInstructionGrammar)

export function parseExpression (input: string): ExpressionTree {
  return parseBinding<ExpressionTree>(input, expressionTreeParser)
}

export function parseInvocation (input: string): InvocationTree {
  return parseBinding<InvocationTree>(input, invocationTreeParser)
}

export function parseInterpolation (input: string): InterpolationTree {
  return parseBinding<InterpolationTree>(input, interpolationTreeParser)
}

export function parseConditionalExpression (input: string): ConditionalExpressionTree {
  return parseBinding<ConditionalExpressionTree>(input, conditionalExpressionTreeParser)
}

export function parseRepeatingInstruction (input: string): RepeatingInstructionTree {
  return parseBinding<RepeatingInstructionTree>(input, repeatingInstructionTreeParser)
}

export {
  ExpressionTree,
  InvocationTree,
  InterpolationTree,
}
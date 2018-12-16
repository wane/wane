import { Grammar } from '../../../libs/parser'
import {
  ExpressionTree,
  InvocationTree,
  InterpolationTree,
  RepeatingInstructionTree,
  ConditionalExpressionTree,
} from './trees'


export const expressionGrammar = new Grammar(ExpressionTree)
export const invocationGrammar = new Grammar(InvocationTree)
export const interpolationGrammar = new Grammar(InterpolationTree)
export const conditionalExpressionGrammar = new Grammar(ConditionalExpressionTree)
export const repeatingInstructionGrammar = new Grammar(RepeatingInstructionTree)

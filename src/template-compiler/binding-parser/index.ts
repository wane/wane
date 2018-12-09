import { ExpressionTree, InterpolationTree, InvocationTree } from './ast'
import { Grammar } from '../../libs/parser/grammar'

export const expressionGrammar = new Grammar(ExpressionTree)
// export const invocationGrammar = new Grammar(InvocationTree)
// export const interpolationGrammar = new Grammar(InterpolationTree)

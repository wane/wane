import { Grammar } from '../../../libs/parser'
import { ExpressionTree, InvocationTree, InterpolationTree } from './trees'


export const expressionGrammar = new Grammar(ExpressionTree)
export const invocationGrammar = new Grammar(InvocationTree)
export const interpolationGrammar = new Grammar(InterpolationTree)
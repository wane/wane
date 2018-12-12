import { isInstance } from '../../../libs/is-instance-ts'
import {
  Parameter,
  ParameterPlaceholder,
  Expression,
  Identifier,
  Literal,
  StringLiteral,
  NumberLiteral,
  ElementAccessExpression,
  PropertyAccessExpression,
  FormattedExpression,
  Invocation,
  ParameterList,
} from './nodes'


export const isParameter = isInstance<Parameter>(Parameter as any)
export const isParameterPlaceholder = isInstance(ParameterPlaceholder)
export const isExpression = isInstance<Expression>(Expression as any)
export const isIdentifier = isInstance(Identifier)
export const isLiteral = isInstance<Literal>(Literal as any)
export const isStringLiteral = isInstance(StringLiteral)
export const isNumberLiteral = isInstance(NumberLiteral)
export const isElementAccessExpression = isInstance(ElementAccessExpression)
export const isPropertyAccessExpression = isInstance(PropertyAccessExpression)
export const isFormattedExpression = isInstance(FormattedExpression)
export const isInvocation = isInstance(Invocation)
export const isParameterList = isInstance(ParameterList)

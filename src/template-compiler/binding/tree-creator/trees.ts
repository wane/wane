import { rule } from '../../../libs/parser'
import {
  Expression,
  Invocation,
  FormattedExpression,
  Identifier,
  ParameterPlaceholder,
} from './nodes'
import { isInstance } from '../../../libs/is-instance-ts'


export class Trees<R extends Expression | Invocation | FormattedExpression> {

  constructor (protected readonly root: R) {
  }

  public getRoot () {
    return this.root
  }

  /**
   * @example
   * a.b.z[c.d] |> e.f(g.h) => a, c, e, g
   */
  public getUsedMembers (): Array<Identifier> { return this.getRoot().getUsedMemberNames() }

  public getUsedMemberNames (): Array<string> { return this.getUsedMembers().map(m => m.getData()) }

}

export class ExpressionTree extends Trees<Expression> {

  @rule(() => [Expression])
  public static accept (root: Expression) {
    return new ExpressionTree(root)
  }

}

export class InvocationTree extends Trees<Invocation> {

  @rule(() => [Invocation])
  public static accept (root: Invocation) {
    return new InvocationTree(root)
  }

  public getPlaceholderPosition (): number | null {
    const params = this.getRoot().getParameterList().getParameters()
    const placeholder = params.findIndex(isInstance(ParameterPlaceholder))
    return placeholder == -1 ? null : placeholder
  }

  public isUsingPlaceholder (): boolean { return this.getPlaceholderPosition() != null }

}

export class InterpolationTree extends Trees<Expression | FormattedExpression> {

  @rule(() => [Expression])
  @rule(() => [FormattedExpression])
  public static accept (root: Expression | FormattedExpression) {
    return new InterpolationTree(root)
  }

}
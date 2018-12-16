import { rule } from '../../../libs/parser'
import {
  Expression,
  Invocation,
  FormattedExpression,
  Identifier,
  ParameterPlaceholder, RepeatingInstruction, ConditionalExpression,
} from './nodes'
import { isInstance } from '../../../libs/is-instance-ts'

type BindingSyntaxTreeTypes = Expression | Invocation | FormattedExpression

export class BindingSyntaxTree<R extends BindingSyntaxTreeTypes = BindingSyntaxTreeTypes> {

  constructor (protected readonly root: R) {
  }

  public getRoot () {
    return this.root
  }

  /**
   * @example
   * a.b.z[c.d] |> e.f(g.h) => a, c, e, g
   */
  public getUsedMembers (): Array<Identifier> { return this.getRoot().getUsedMembers() }

  public getUsedMemberNames (): Array<string> { return this.getUsedMembers().map(m => m.getData()) }

}

export class ExpressionTree extends BindingSyntaxTree<Expression> {

  @rule(() => [Expression])
  public static accept (root: Expression) {
    return new ExpressionTree(root)
  }

}

export class InvocationTree extends BindingSyntaxTree<Invocation> {

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

export class InterpolationTree extends BindingSyntaxTree<Expression | FormattedExpression> {

  @rule(() => [Expression])
  @rule(() => [FormattedExpression])
  public static accept (root: Expression | FormattedExpression) {
    return new InterpolationTree(root)
  }

}

export class ConditionalExpressionTree extends BindingSyntaxTree<ConditionalExpression> {

  @rule(() => [ConditionalExpression])
  public static accept (root: ConditionalExpression) {
    return new ConditionalExpressionTree(root)
  }

}

export class RepeatingInstructionTree extends BindingSyntaxTree<RepeatingInstruction> {

  @rule(() => [RepeatingInstruction])
  public static accept (root: RepeatingInstruction) {
    return new RepeatingInstructionTree(root)
  }

}
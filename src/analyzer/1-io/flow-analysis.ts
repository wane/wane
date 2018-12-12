import { Block, Expression, SyntaxKind, TypeGuards, PropertyAccessExpression } from 'ts-simple-ast'


/**
 * returns "this.a" for "this.a.b.c.d.e.f"
 */
function getLeftmostPropertyAccessExpression (propertyAccessExpression: PropertyAccessExpression): PropertyAccessExpression {
  let current = propertyAccessExpression
  while (TypeGuards.isPropertyAccessExpression(current.getExpression())) {
    current = current.getExpression() as PropertyAccessExpression
  }
  return current
}

const ASSIGNMENT_TOKENS = [
  SyntaxKind.EqualsToken,
  SyntaxKind.PlusEqualsToken,
  SyntaxKind.MinusEqualsToken,
  SyntaxKind.AsteriskEqualsToken,
  SyntaxKind.SlashEqualsToken,
  SyntaxKind.PercentEqualsToken,
  SyntaxKind.AsteriskAsteriskEqualsToken,
  SyntaxKind.LessThanLessThanEqualsToken,
  SyntaxKind.GreaterThanGreaterThanEqualsToken,
  SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
  SyntaxKind.AmpersandEqualsToken,
  SyntaxKind.CaretEqualsToken,
  SyntaxKind.BarEqualsToken,
]

export function getMemberModifiedByExpression (expression: Expression): string | null {
  if (TypeGuards.isBinaryExpression(expression)) {
    // Find the usual "this.prop = something" modification.

    // Not any sort of assignment (could be eg. less than).
    const syntaxKind = expression.getOperatorToken().getKind()
    if (!ASSIGNMENT_TOKENS.includes(syntaxKind)) return null

    const left = expression.getLeft()

    // The left side is not even property access, meaning it cannot start with "this.".
    // It's an assignment to a local or global variable.
    if (!TypeGuards.isPropertyAccessExpression(left)) return null

    // Grab the "a.b" of "a.b.c.d.e.f"
    const leftmostPropertyAccessExpression = getLeftmostPropertyAccessExpression(left)

    // If it's not "this.something", then this is not assignment to a class member.
    if (leftmostPropertyAccessExpression.getExpression().getKind() != SyntaxKind.ThisKeyword) return null

    // Recognized.
    return left.getName()

  } else if (TypeGuards.isPostfixUnaryExpression(expression) || TypeGuards.isPrefixUnaryExpression(expression)) {
    // Find "this.foo++" things.

    const operand = expression.getOperand()

    // The operand is not property access at all, so it cannot be "this." access.
    if (!TypeGuards.isPropertyAccessExpression(operand)) return null

    // Grab the "a.b" of "a.b.c.d.e"
    const leftmostPropertyAccessExpression = getLeftmostPropertyAccessExpression(operand)

    // Not a "this.something" access
    if (leftmostPropertyAccessExpression.getExpression().getKind() != SyntaxKind.ThisKeyword) return null

    // If we're here then it should be actual property modification.
    return operand.getName()
  }

  return null
}

export function getDirectlyModifiedMemberNamesFromBlock (block: Block): Array<string> {
  const result: Array<string> = []
  const expressions = block.getDescendantsOfKind(SyntaxKind.ExpressionStatement)
  for (const expression of expressions) {
    const prop = getMemberModifiedByExpression(expression.getExpression())
    if (prop == null) continue
    result.push(prop)
  }
  return result
}

export function getDirectlyCalledMethodNamesFromBlock (block: Block): Array<string> {
  const result: Array<string> = []
  const callExpressions = block.getDescendantsOfKind(SyntaxKind.CallExpression)
  for (const callExpression of callExpressions) {
    const expression = callExpression.getExpression()

    // Cannot be a "this.something()" call if it's not even a prop access
    if (!TypeGuards.isPropertyAccessExpression(expression)) continue

    // Similar to "getMemberModifiedByExpression" above.
    const leftmostExpression = getLeftmostPropertyAccessExpression(expression)
    if (leftmostExpression.getExpression().getKind() != SyntaxKind.ThisKeyword) continue
    result.push(leftmostExpression.getName())
  }
  return result
}

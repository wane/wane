import { ClassDeclaration, Expression, SyntaxKind, TypeGuards } from 'ts-simple-ast'

function getMethodsCalledDirectlyFrom (
  classDeclaration: ClassDeclaration,
  methodName: string,
): Set<string> {
  const result = new Set<string>()

  const methodDeclaration = classDeclaration.getMethod(methodName)

  if (methodDeclaration == null) {
    const className = classDeclaration.getName()
    throw new Error(`Expected to find method "${methodName}" in class "${className}".`)
  }

  const block = methodDeclaration.getChildrenOfKind(SyntaxKind.Block)[0]

  for (const callExpression of block.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const expression = callExpression.getExpression()
    if (!TypeGuards.isPropertyAccessExpression(expression)) continue
    if (expression.getExpression().getKind() != SyntaxKind.ThisKeyword) continue
    result.add(expression.getName())
  }

  return result
}

export function getMethodsCalledFrom (
  classDeclaration: ClassDeclaration,
  methodName: string,
): Set<string> {
  const result = new Set<string>()
  const visited = new Set<string>([methodName])
  const stack: string[] = [methodName]

  while (stack.length > 0) {
    const current = stack.pop()!

    for (const methodCalledDirectly of getMethodsCalledDirectlyFrom(classDeclaration, current)) {
      if (visited.has(methodCalledDirectly)) continue
      result.add(methodCalledDirectly)
      visited.add(methodCalledDirectly)
      stack.push(methodCalledDirectly)
    }
  }

  return result
}

function getPropertyModifiedByThisExpressionIfAny (
  classDeclaration: ClassDeclaration,
  expression: Expression,
): string | undefined {

  // Find the usual "this.prop = something" modification.
  if (TypeGuards.isBinaryExpression(expression)) {

    // Not assignment (could be eg. less than):
    if (expression.getOperatorToken().getKind() != SyntaxKind.EqualsToken) return undefined
    const left = expression.getLeft()

    // The left side is not even property access, meaning it cannot start with "this.".
    // It's an assignment to a local or global variable:
    if (!TypeGuards.isPropertyAccessExpression(left)) return undefined

    // The first thing in the chain of access is not "this":
    if (left.getExpression().getKind() != SyntaxKind.ThisKeyword) return undefined

    // If we're here then it should be actual property modification.
    return left.getName()

    // Find "this.foo++" things.
  } else if (TypeGuards.isPostfixUnaryExpression(expression) || TypeGuards.isPrefixUnaryExpression(expression)) {
    const operand = expression.getOperand()

    // The operand is not property access at all, so it cannot be "this." access.
    if (!TypeGuards.isPropertyAccessExpression(operand)) return undefined

    // The operand is access, but not "this." access.
    if (operand.getExpression().getKind() != SyntaxKind.ThisKeyword) return undefined

    // If we're here then it should be actual property modification.
    return operand.getName()
  }

  return undefined
}

function getPropsWhichCanBeModifiedDirectlyBy (
  classDeclaration: ClassDeclaration,
  methodName: string,
): Set<string> {
  const result = new Set<string>()

  const methodDeclaration = classDeclaration.getMethod(methodName)

  if (methodDeclaration == null) {
    const className = classDeclaration.getName()
    throw new Error(`Expected to find method "${methodName}" in class "${className}".`)
  }

  const block = methodDeclaration.getChildrenOfKind(SyntaxKind.Block)[0]

  for (const expression of block.getDescendantsOfKind(SyntaxKind.ExpressionStatement)) {
    const prop = getPropertyModifiedByThisExpressionIfAny(classDeclaration, expression.getExpression())
    if (prop == null) continue
    result.add(prop)
  }

  return result
}

export function getPropsWhichCanBeModifiedBy (
  classDeclaration: ClassDeclaration,
  methodName: string,
): Set<string> {
  const result = new Set<string>()

  // Directly...
  for (const prop of getPropsWhichCanBeModifiedDirectlyBy(classDeclaration, methodName)) {
    result.add(prop)
  }

  // And indirectly...
  for (const method of getMethodsCalledFrom(classDeclaration, methodName)) {
    for (const prop of getPropsWhichCanBeModifiedDirectlyBy(classDeclaration, method)) {
      result.add(prop)
    }
  }

  return result
}

function canPropBeModifiedByMethod (
  classDeclaration: ClassDeclaration,
  propName: string,
  methodName: string,
): boolean {
  const props = getPropsWhichCanBeModifiedBy(classDeclaration, methodName)
  return props.has(propName)
}

export function canPropBeModified (
  classDeclaration: ClassDeclaration,
  propName: string,
): boolean {
  const methodNames = classDeclaration.getMethods()
    .map(methodDeclaration => methodDeclaration.getName())
  return methodNames.some(methodName => canPropBeModifiedByMethod(classDeclaration, propName, methodName))
}

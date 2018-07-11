import { Block, ClassDeclaration, Expression, SyntaxKind, TypeGuards } from 'ts-simple-ast'

export function getMethodBody (
  classDeclaration: ClassDeclaration,
  methodName: string,
): Block {
  const methodDeclaration = classDeclaration.getMethod(methodName)

  if (methodDeclaration == null) {
    const className = classDeclaration.getName()
    throw new Error(`Expected to find method "${methodName}" in class "${className}".`)
  }

  return methodDeclaration.getFirstChildOrThrow(TypeGuards.isBlock) as Block
}

function getMethodNamesCalledDirectlyFrom (
  functionBody: Block,
): Set<string> {
  const result = new Set<string>()

  const callExpressions = functionBody.getDescendantsOfKind(SyntaxKind.CallExpression)
  for (const callExpression of callExpressions) {
    const expression = callExpression.getExpression()
    if (!TypeGuards.isPropertyAccessExpression(expression)) continue
    if (expression.getExpression().getKind() != SyntaxKind.ThisKeyword) continue
    result.add(expression.getName())
  }

  return result
}

export function getMethodNamesCalledFrom (
  methodBody: Block,
): Set<string> {
  const method = methodBody.getFirstAncestorByKindOrThrow(SyntaxKind.MethodDeclaration)
  const methodName = method.getName()
  const classDeclaration = method.getFirstAncestorByKindOrThrow(SyntaxKind.ClassDeclaration)

  const result = new Set<string>()
  const visited = new Set<string>([methodName])
  const stack: string[] = [methodName]

  while (stack.length > 0) {
    const current = stack.pop()!

    const methodBody = getMethodBody(classDeclaration, current)
    const methodNamesCalledDirectly = getMethodNamesCalledDirectlyFrom(methodBody)
    for (const methodNamedCalledDirectly of methodNamesCalledDirectly) {
      if (visited.has(methodNamedCalledDirectly)) continue
      result.add(methodNamedCalledDirectly)
      visited.add(methodNamedCalledDirectly)
      stack.push(methodNamedCalledDirectly)
    }
  }

  return result
}

function getPropertyNameModifiedByThisExpressionIfAny (
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

function getPropsNamesWhichCanBeModifiedDirectlyBy (
  functionBody: Block
): Set<string> {
  const result = new Set<string>()

  const expressions = functionBody.getDescendantsOfKind(SyntaxKind.ExpressionStatement)
  for (const expression of expressions) {
    const prop = getPropertyNameModifiedByThisExpressionIfAny(expression.getExpression())
    if (prop == null) continue
    result.add(prop)
  }

  return result
}

export function getPropNamesWhichCanBeModifiedBy (
  functionBody: Block,
): Set<string> {
  const classDeclaration = functionBody.getFirstAncestorByKindOrThrow(SyntaxKind.ClassDeclaration)

  const result = new Set<string>()

  // Directly...
  for (const prop of getPropsNamesWhichCanBeModifiedDirectlyBy(functionBody)) {
    result.add(prop)
  }

  // And indirectly...
  for (const method of getMethodNamesCalledFrom(functionBody)) {
    const indirectMethodBody = getMethodBody(classDeclaration, method)
    for (const prop of getPropsNamesWhichCanBeModifiedDirectlyBy(indirectMethodBody)) {
      result.add(prop)
    }
  }

  return result
}

function canPropBeModifiedByMethodInClass (
  propName: string,
  methodName: string,
  classDeclaration: ClassDeclaration,
): boolean {
  const body = getMethodBody(classDeclaration, methodName)
  const props = getPropNamesWhichCanBeModifiedBy(body)
  return props.has(propName)
}

export function canPropBeModifiedInClass (
  propName: string,
  classDeclaration: ClassDeclaration,
): boolean {
  const methodNames = classDeclaration.getMethods()
    .map(methodDeclaration => methodDeclaration.getName())
  return methodNames.some(methodName => canPropBeModifiedByMethodInClass(propName, methodName, classDeclaration))
}

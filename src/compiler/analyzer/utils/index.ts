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

function getBodiesCalledDirectlyFrom (
  functionBody: Block,
): Set<Block> {
  const result = new Set<Block>()

  const callExpressions = functionBody.getDescendantsOfKind(SyntaxKind.CallExpression)
  for (const callExpression of callExpressions) {
    const expression = callExpression.getExpression()

    // Hunt for this.methodName()
    if (TypeGuards.isPropertyAccessExpression(expression)) {
      if (expression.getExpression().getKind() == SyntaxKind.ThisKeyword) {
        const methodName = expression.getName()
        const classDeclaration = expression.getFirstAncestorByKindOrThrow(SyntaxKind.ClassDeclaration)
        const methodDeclaration = classDeclaration.getMethodOrThrow(methodName)
        const methodBody = methodDeclaration.getFirstDescendantByKindOrThrow(SyntaxKind.Block)
        result.add(methodBody)
      }
    }
  }

  return result
}

export function getBodiesCalledFrom (
  methodBody: Block,
): Set<Block> {
  const result = new Set<Block>()
  const visited = new Set<Block>([methodBody])
  const stack: Block[] = [methodBody]

  while (stack.length > 0) {
    const methodBody = stack.pop()!
    const methodNamesCalledDirectly = getBodiesCalledDirectlyFrom(methodBody)
    for (const methodNamedCalledDirectly of methodNamesCalledDirectly) {
      if (visited.has(methodNamedCalledDirectly)) continue
      result.add(methodNamedCalledDirectly)
      visited.add(methodNamedCalledDirectly)
      stack.push(methodNamedCalledDirectly)
    }
  }

  return result
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

function getPropertyNameModifiedByThisExpressionIfAny (
  expression: Expression,
): string | undefined {

  if (TypeGuards.isBinaryExpression(expression)) {
    // Find the usual "this.prop = something" modification.

    // Not any sort of assignment (could be eg. less than):
    const syntaxKind = expression.getOperatorToken().getKind()
    if (!ASSIGNMENT_TOKENS.includes(syntaxKind)) return undefined

    const left = expression.getLeft()

    // The left side is not even property access, meaning it cannot start with "this.".
    // It's an assignment to a local or global variable:
    if (!TypeGuards.isPropertyAccessExpression(left)) return undefined

    // The first thing in the chain of access is not "this":
    if (left.getExpression().getKind() != SyntaxKind.ThisKeyword) return undefined

    // If we're here then it should be actual property modification.
    return left.getName()

  } else if (TypeGuards.isPostfixUnaryExpression(expression) || TypeGuards.isPrefixUnaryExpression(expression)) {
    // Find "this.foo++" things.
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
  functionBody: Block,
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
  const result = new Set<string>()

  // Directly...
  for (const propName of getPropsNamesWhichCanBeModifiedDirectlyBy(functionBody)) {
    result.add(propName)
  }

  // And indirectly...
  for (const indirectMethodBody of getBodiesCalledFrom(functionBody)) {
    for (const propName of getPropsNamesWhichCanBeModifiedDirectlyBy(indirectMethodBody)) {
      result.add(propName)
    }
  }

  return result
}

function canPropBeModifiedByBlockInClass (
  propName: string,
  block: Block,
): boolean {
  const props = getPropNamesWhichCanBeModifiedBy(block)
  return props.has(propName)
}

export function canPropBeModifiedInClass (
  propName: string,
  classDeclaration: ClassDeclaration,
): boolean {
  const methodBodies = classDeclaration.getMethods()
    .map(method => method.getFirstChildByKindOrThrow(SyntaxKind.Block))
  return methodBodies.some(methodBody => {
    return canPropBeModifiedByBlockInClass(propName, methodBody)
  })
}

export function isMethodBody (block: Block): boolean {
  const parent = block.getParentIfKind(SyntaxKind.MethodDeclaration)
  return parent != null
}

export function getMethodNameOrThrow (block: Block): string {
  const isMethod = isMethodBody(block)
  if (!isMethod) {
    throw new Error(`Expected block to be a block of a method.\n${block.getText()}`)
  }
  const methodDeclaration = block.getFirstAncestorByKindOrThrow(SyntaxKind.MethodDeclaration)
  return methodDeclaration.getName()
}

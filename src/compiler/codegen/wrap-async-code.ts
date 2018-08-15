import {
  ArrowFunction,
  Block,
  ClassDeclaration,
  CodeBlockWriter,
  Scope,
  SyntaxKind,
  SyntaxList,
  TypeGuards
} from 'ts-simple-ast'

/**
 * @param {ArrowFunction} arrowFunction
 * @returns {boolean} Has any transformation been done?
 */
export function expandArrowFunction (arrowFunction: ArrowFunction): boolean {

  const equalsGreaterThen = arrowFunction.getEqualsGreaterThan()
  const nextNode = equalsGreaterThen.getNextSiblingOrThrow()

  // If the function already has a block (is expanded), we bail out.
  if (TypeGuards.isBlock(nextNode)) {
    return false
  }

  // If the returned value is parenthesized expression, we strip away the parenthesis.
  // This is for cases like () => ({}), where we wanna just "return {}" instead of "return ({})".
  const desiredReturnValue = nextNode.getKind() == SyntaxKind.ParenthesizedExpression
    ? nextNode.getText().slice(1, -1)
    : nextNode.getText()

  nextNode.replaceWithText(writer => {
    writer
      .write(`{`)
      .newLine()
      .indentBlock(() => {
        writer.writeLine(`return ${desiredReturnValue}`)
      })
      .write(`}`)
  })

  return true

}

/**
 * @param {SyntaxList} syntaxList
 * @returns {boolean} Was a transformation made?
 */
export function expandCallback (syntaxList: SyntaxList): boolean {

  const node = syntaxList.getFirstChildOrThrow()

  // Things like ".then(this.handle.bind(this)" or ".then(handles)".
  if (TypeGuards.isCallExpression(node) || TypeGuards.isIdentifier(node)) {
    node.replaceWithText(writer => {
      writer
        .write(`(...args: any[]) => {`)
        .newLine()
        .indentBlock(() => {
          writer.writeLine(`return ${node.getText()}(...args)`)
        })
        .write(`}`)
    })
    return true
  }

  // An arrow function, we delegate this.
  if (TypeGuards.isArrowFunction(node)) {
    expandArrowFunction(node)
    return true
  }

  return false

}

export function injectCodeInExpandedFunction (syntaxList: SyntaxList,
                                              injectCode: (writer: CodeBlockWriter) => boolean): boolean {

  const node = syntaxList.getFirstChildOrThrow()

  let didInjectionHappen = false

  node.replaceWithText(writer => {
    writer
      .write(`(...args: any[]) => {`)
      .indentBlock(() => {
        writer.writeLine(`const __wane__result = (${node.getText()})(...args)`)
        didInjectionHappen = injectCode(writer)
        writer.writeLine(`return __wane__result`)
      })
      .write(`}`)
  })

  return didInjectionHappen

}

export function injectConstructorParam (
  classDeclaration: ClassDeclaration,
  scope: Scope | undefined,
  name: string,
  type: string,
): void {

  const constructorNodes = classDeclaration.getConstructors()

  // No constructor
  if (constructorNodes.length == 0) {
    classDeclaration.addConstructor({
      parameters: [{ scope, name, type }]
    })
    return
  }

  // Constructor exists
  const constructorNode = constructorNodes[0]
  constructorNode.addParameter({ scope, name, type })

}

export function wrapAsyncCode (classDeclaration: ClassDeclaration,
                               injectCode: (block: Block, index: number) => (writer: CodeBlockWriter) => boolean): boolean {

  let needsConstructorInjection = false
  let counter: number = 0

  const methods = [...classDeclaration.getMethods(), ...classDeclaration.getConstructors()]
  for (const method of methods) {

    const block = method.getFirstDescendantByKind(SyntaxKind.Block)
    if (block == null) continue

    // Hunt for "then" and "catch" in promises.
    const propAccessExpressions = method.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
    for (const propAccessExpression of propAccessExpressions.reverse()) {

      // We care only for .then and .catch
      const name = propAccessExpression.getName()
      if (name != 'then' && name != 'catch') continue

      // Grab the syntax list (arguments of the method)
      const syntaxList = propAccessExpression.getNextSiblingOrThrow(TypeGuards.isSyntaxList) as SyntaxList

      needsConstructorInjection = expandCallback(syntaxList) || needsConstructorInjection
      const block = syntaxList!.getFirstDescendantByKindOrThrow(SyntaxKind.Block)
      const isCodeInjected = injectCodeInExpandedFunction(syntaxList, injectCode(block, counter))

      if (isCodeInjected) {
        counter++
      }

    }

    // Hunt for "setTimeout" and "setInterval"
    const callExpressions = method.getDescendantsOfKind(SyntaxKind.CallExpression)
    for (const callExpression of callExpressions.reverse()) {

      // A call can be made as usual:   foo()
      // But also unusual, for example: (x => x + 1)(3)
      // We ignore everything that's not the "usual" thing here.
      const expression = callExpression.getExpression()
      if (!TypeGuards.isIdentifier(expression)) continue

      // We care only for "setTimeout" and "setInterval"
      const functionName = expression.getText()
      if (functionName != 'setTimeout' && functionName != 'setInterval') continue

      // Just like in the previous loop, we grab the syntax list and do stuff.
      const syntaxList = expression.getNextSiblingOrThrow(TypeGuards.isSyntaxList) as SyntaxList

      needsConstructorInjection = expandCallback(syntaxList) || needsConstructorInjection
      const block = syntaxList!.getFirstDescendantByKindOrThrow(SyntaxKind.Block)
      const isCodeInjected = injectCodeInExpandedFunction(syntaxList, injectCode(block, counter))

      if (isCodeInjected) {
        counter++
      }

    }

  }

  if (needsConstructorInjection) {
    injectConstructorParam(classDeclaration, Scope.Private, '__wane__factory', 'any')
    return true
  }

  return false

}

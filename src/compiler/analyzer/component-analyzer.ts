import {
  Block,
  ClassDeclaration,
  MethodDeclaration,
  NoSubstitutionTemplateLiteral,
  SyntaxKind,
  SyntaxList,
  TypeGuards,
} from 'ts-simple-ast'
import { ComponentTemplateAnalyzer } from './component-template-analyzer'
import { ViewBinding } from '../template-nodes/view-bindings'
import { TemplateNodeValue } from '../template-nodes/nodes/template-node-value-base'
import {
  canPropBeModifiedInClass,
  getBodiesCalledFrom,
  getMethodBody,
  getMethodNameOrThrow,
  getPropNamesWhichCanBeModifiedBy,
} from './utils'
import { echoize } from '../utils/echoize'
import { ProjectAnalyzer } from './project-analyzer'
import { paramCase, pascalCase } from 'change-case'
import { oneLine } from 'common-tags'
import { nullish } from '../utils/utils'

export class ComponentAnalyzer {

  public readonly componentTemplateAnalyzer: ComponentTemplateAnalyzer
  public readonly classDeclaration: ClassDeclaration

  constructor (public projectAnalyzer: ProjectAnalyzer,
               classDeclaration: ClassDeclaration) {
    this.classDeclaration = classDeclaration
    this.componentTemplateAnalyzer =
      new ComponentTemplateAnalyzer(this.projectAnalyzer, classDeclaration, this)
  }

  @echoize()
  public getFilePath (): string {
    const sourceFile = this.classDeclaration.getSourceFile()
    const path = sourceFile.getFilePath()
    const fileName = sourceFile.getBaseNameWithoutExtension()
    return `${path}/${fileName}`
  }

  @echoize()
  public getClassNameOrUndefined (): string | undefined {
    return this.classDeclaration.getName()
  }

  @echoize()
  public getPrettyClassName (): string {
    const className = this.getClassNameOrUndefined()
    return nullish(className, `UnnamedComponent`)
  }

  @echoize()
  public getClassNameOrThrow (): string {
    return this.classDeclaration.getNameOrThrow()
  }

  /**
   * A pascal-case name for the component.
   *
   * If the class has a name, we use that.
   * Otherwise, we use the file name -- unless it's named index, in which case
   * we use the name of the directory where index.ts resides.
   */
  @echoize()
  public getComponentName (): string {
    const className = this.getClassNameOrUndefined()
    if (className != null) {
      return className
    }

    const sourceFile = this.classDeclaration.getSourceFile()
    const fileName = sourceFile.getBaseNameWithoutExtension()
    if (fileName != 'index') {
      return pascalCase(fileName)
    }

    const directory = sourceFile.getDirectory()
    const dirName = directory.getBaseName()
    return dirName
  }

  @echoize()
  public getDomTagName (): string {
    return 'w-' + paramCase(this.getComponentName())
  }

  @echoize()
  public getFullName () {
    const sourceFile = this.classDeclaration.getSourceFile()
    const path = sourceFile.getFilePath()
    const fileName = sourceFile.getBaseNameWithoutExtension()
    const className = this.getPrettyClassName()
    return `${path}/${fileName}#${className}`
  }

  @echoize()
  public getNamesOfAllPropsAndGetters (): Set<string> {
    return new Set([
      ...this.classDeclaration.getProperties(),
      ...this.classDeclaration.getGetAccessors(),
    ].map(x => x.getName()))
  }

  @echoize()
  public getNamesOfAllMethods (): Set<string> {
    return new Set(this.classDeclaration.getMethods().map(x => x.getName()))
  }

  @echoize()
  public getNamesOfInputs (): Iterable<string> {
    return [...this.classDeclaration.getProperties()]
      .filter(prop => prop.hasModifier(SyntaxKind.PublicKeyword))
      .map(prop => prop.getName())
  }

  @echoize()
  public getNamesOfRequiredInputs (): Iterable<string> {
    return [...this.getNamesOfInputs()]
      .filter(inputName => {
        const propDeclaration = this.classDeclaration.getPropertyOrThrow(inputName)
        const hasInitializer = propDeclaration.hasInitializer()
        const type = propDeclaration.getType()
        return !type.isNullable() && !hasInitializer
      })
  }

  @echoize()
  public getNamesOfOptionalInputs (): Iterable<string> {
    return [...this.getNamesOfInputs()]
      .filter(inputName => {
        const propDeclaration = this.classDeclaration.getPropertyOrThrow(inputName)
        const hasInitializer = propDeclaration.hasInitializer()
        const type = propDeclaration.getType()
        return type.isNullable() || hasInitializer
      })
  }

  @echoize()
  public getMethodDeclaration (methodName: string): MethodDeclaration {
    return this.classDeclaration.getMethodOrThrow(methodName)
  }

  @echoize()
  public getNamesOfPropertiesBoundToTemplate (): Set<ViewBinding<TemplateNodeValue>> {
    return this.componentTemplateAnalyzer.getNamesOfBoundProperties()
  }

  @echoize()
  public getRegisteredComponentsDeclarations (): Map<string, ClassDeclaration> {
    const component = this.classDeclaration
    const result = new Map<string, ClassDeclaration>()

    const registeredComponentsDecorator = component.getDecorator('Register')
    if (registeredComponentsDecorator == null) return result

    const argNodes = registeredComponentsDecorator.getArguments()
    argNodes.forEach(argNode => {
      const registeredName = argNode.getText()
      const declarations = argNode.getType().getSymbolOrThrow().getDeclarations()
      const classDeclaration = declarations.find(TypeGuards.isClassDeclaration)
      if (classDeclaration == null) {
        throw new Error(`Could not find class declaration for "${registeredName}".`)
      }
      result.set(registeredName, classDeclaration)
    })
    return result
  }

  @echoize()
  public getRegisteredClassDeclaration (registeredName: string): ClassDeclaration | undefined {
    for (const [name, classDeclaration] of this.getRegisteredComponentsDeclarations()) {
      if (name == registeredName) {
        return classDeclaration
      }
    }
    return undefined
  }

  @echoize()
  public getRegisteredClassDeclarationOrThrow (registeredName: string): ClassDeclaration {
    const result = this.getRegisteredClassDeclaration(registeredName)
    if (result == null) {
      throw new Error(oneLine`Component "${registeredName}" not registered
        in component "${this.getFullName()}".`)
    }
    return result
  }

  @echoize()
  public getBodyForMethod (methodName: string): Block {
    return getMethodBody(this.classDeclaration, methodName)
  }

  @echoize()
  public getMethodsNamesCalledFrom (methodNameOrBody: string | Block): Set<string> {
    const body = typeof methodNameOrBody == 'string'
      ? this.getBodyForMethod(methodNameOrBody)
      : methodNameOrBody
    const bodies = getBodiesCalledFrom(body)
    const namesArr = [...bodies].map(getMethodNameOrThrow)
    return new Set(namesArr)
  }

  @echoize()
  public getPropsWhichCanBeModifiedBy (methodName: string): Set<string> {
    return getPropNamesWhichCanBeModifiedBy(this.getBodyForMethod(methodName))
  }

  /**
   * For now, we treat all getters modifiable until we address them in more depth.
   * TODO ^
   *
   * Also we treat all inputs as non-readonly even though we don't ask if they are actually used.
   * We can address this edge case later.
   * TODO ^
   *
   * @param {string} propOrGetterName
   * @returns {boolean}
   */
  @echoize()
  public canPropOrGetterBeModified (propOrGetterName: string): boolean {
    if (![...this.getNamesOfAllPropsAndGetters()].includes(propOrGetterName)) {
      throw new Error(`Expected to find prop or getter "${propOrGetterName}" in "${this.getPrettyClassName()}".`)
    }

    const allGetters = this.classDeclaration.getGetAccessors()
      .map(getAccessor => getAccessor.getName())

    const isGetter = allGetters.includes(propOrGetterName)
    const isInput = [...this.getNamesOfInputs()].includes(propOrGetterName)
    const isModifiableInClass = canPropBeModifiedInClass(propOrGetterName, this.classDeclaration)

    return isInput || isGetter || isModifiableInClass
  }

  @echoize()
  public getAllVariables (): Set<string> {
    const result = new Set<string>()
    for (const prop of this.getNamesOfAllPropsAndGetters()) {
      if (this.canPropOrGetterBeModified(prop)) {
        result.add(prop)
      }
    }
    return result
  }

  @echoize()
  public getAllConstants (): Set<string> {
    const result = new Set<string>()
    for (const prop of this.getNamesOfAllPropsAndGetters()) {
      if (!this.canPropOrGetterBeModified(prop)) {
        result.add(prop)
      }
    }
    return result
  }

  @echoize()
  public getConstantName (propName: string): string {
    return `${this.getPrettyClassName()}$${propName}`
  }

  @echoize()
  public getConstantValue (propName: string): string {
    const declaration = this.classDeclaration.getPropertyOrThrow(propName)
    const initializer = declaration.getInitializerOrThrow()
    return initializer.getText()
  }

  @echoize()
  public getStyles (): string | null {
    const component = this.classDeclaration
    const styleDecorator = component.getDecorator('Style')
    if (styleDecorator == null) return null
    const string = styleDecorator.getArguments()[0]
    if (string instanceof NoSubstitutionTemplateLiteral) {
      return string.getLiteralValue()
    }
    return null
  }

  @echoize()
  public hasStyles (): boolean {
    return this.getStyles() != null
  }

  private asyncBlocksWhichCauseUpdate = new Map<number, SyntaxList>()

  public registerAsyncBlockWhichCausesUpdate (index: number, syntaxList: SyntaxList): void {
    this.asyncBlocksWhichCauseUpdate.set(index, syntaxList)
  }

  public getAsyncBlocksWhichCauseUpdate () {
    return this.asyncBlocksWhichCauseUpdate
  }

  public hasAsyncBlocksWhichCauseUpdate () {
    return this.getAsyncBlocksWhichCauseUpdate().size > 0
  }

  public isDefaultExport (): boolean {
    return this.classDeclaration.getDescendantsOfKind(SyntaxKind.DefaultKeyword).length > 0
  }

}

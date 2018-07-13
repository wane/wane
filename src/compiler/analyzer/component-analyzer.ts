import {
  ClassDeclaration,
  MethodDeclaration,
  SyntaxKind,
  NoSubstitutionTemplateLiteral,
  TypeGuards, Block,
} from 'ts-simple-ast'
import {ComponentTemplateAnalyzer} from './component-template-analyzer'
import {ViewBinding} from '../template-nodes/view-bindings'
import {TemplateNodeValue} from '../template-nodes/nodes/template-node-value-base'
import {
  canPropBeModifiedInClass,
  getMethodBody,
  getMethodNamesCalledFrom,
  getPropNamesWhichCanBeModifiedBy
} from './utils'
import { echoize } from '../utils/echoize'

export class ComponentAnalyzer {

  public readonly componentTemplateAnalyzer: ComponentTemplateAnalyzer
  public classDeclaration: ClassDeclaration

  constructor (classDeclaration: ClassDeclaration) {
    this.classDeclaration = classDeclaration
    this.componentTemplateAnalyzer = new ComponentTemplateAnalyzer(classDeclaration, this)
  }

  @echoize()
  public getFilePath (): string {
    const sourceFile = this.classDeclaration.getSourceFile()
    const path = sourceFile.getFilePath()
    const fileName = sourceFile.getBaseNameWithoutExtension()
    return `${path}/${fileName}`
  }

  @echoize()
  public getClassName (): string {
    return this.classDeclaration.getNameOrThrow()
  }

  @echoize()
  public getFullName () {
    const sourceFile = this.classDeclaration.getSourceFile()
    const path = sourceFile.getFilePath()
    const fileName = sourceFile.getBaseNameWithoutExtension()
    const className = this.getClassName()
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
  public getMethodDeclaration (methodName: string): MethodDeclaration {
    return this.classDeclaration.getMethodOrThrow(methodName)
  }

  @echoize()
  public getNamesOfPropertiesBoundToTemplate (): Set<ViewBinding<TemplateNodeValue>> {
    return this.componentTemplateAnalyzer.getNamesOfBoundProperties()
  }

  @echoize()
  public getRegisteredComponentsDeclarations (): Set<ClassDeclaration> {
    const component = this.classDeclaration
    const set = new Set<ClassDeclaration>()
    const registeredComponentsDecorator = component.getDecorator('Register')
    if (registeredComponentsDecorator == null) return set
    const klasses = registeredComponentsDecorator.getArguments()
    klasses.forEach(klass => {
      const declarations = klass.getType().getSymbolOrThrow().getDeclarations()
      const classDeclaration = declarations.find(TypeGuards.isClassDeclaration)
      if (classDeclaration == null) {
        throw new Error(`Could not find class declaration for "${klass.getText()}".`)
      }
      set.add(classDeclaration)
    })
    return set
  }

  @echoize()
  public getRegisteredComponentDeclaration (componentName: string): ClassDeclaration {
    for (const klass of this.getRegisteredComponentsDeclarations()) {
      if (klass.getName() == componentName) {
        return klass
      }
    }
    throw new Error(`Component "${componentName}" not registered in component "${this.getFullName()}".`)
  }

  @echoize()
  public getBodyForMethod (methodName: string): Block {
    return getMethodBody(this.classDeclaration, methodName)
  }

  @echoize()
  public getMethodsCalledFrom (methodName: string): Set<string> {
    return getMethodNamesCalledFrom(this.getBodyForMethod(methodName))
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
   * @param {string} propName
   * @returns {boolean}
   */
  @echoize()
  public canPropBeModified (propName: string): boolean {
    const allGetters = this.classDeclaration.getGetAccessors()
      .map(getAccessor => getAccessor.getName())
    const isGetter = allGetters.includes(propName)

    const isInput = [...this.getNamesOfInputs()].includes(propName)

    return isInput || isGetter || canPropBeModifiedInClass(propName, this.classDeclaration)
  }

  @echoize()
  public getAllVariables (): Set<string> {
    const result = new Set<string>()
    for (const prop of this.getNamesOfAllPropsAndGetters()) {
      if (this.canPropBeModified(prop)) {
        result.add(prop)
      }
    }
    return result
  }

  @echoize()
  public getAllConstants (): Set<string> {
    const result = new Set<string>()
    for (const prop of this.getNamesOfAllPropsAndGetters()) {
      if (!this.canPropBeModified(prop)) {
        result.add(prop)
      }
    }
    return result
  }

  @echoize()
  public getConstantName (propName: string): string {
    return `${this.getClassName()}$${propName}`
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

}

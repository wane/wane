import {
  ClassDeclaration,
  MethodDeclaration,
  NoSubstitutionTemplateLiteral,
  PropertyDeclaration,
  SyntaxKind,
  Type,
  TypeGuards,
} from 'ts-simple-ast'
import {ComponentTemplateAnalyzer} from './component-template-analyzer'
import {ViewBinding} from '../template-nodes/view-bindings'
import {TemplateNodeValue} from '../template-nodes/nodes/template-node-value-base'
import {canPropBeModified, getMethodsCalledFrom, getPropsWhichCanBeModifiedBy} from './utils'
import {echoize} from '../utils/echoize'
import {ProjectAnalyzer} from './project-analyzer'

export class ComponentAnalyzer {

  public readonly componentTemplateAnalyzer: ComponentTemplateAnalyzer
  public classDeclaration: ClassDeclaration

  constructor (
    public readonly projectAnalyzer: ProjectAnalyzer,
    classDeclaration: ClassDeclaration,
  ) {
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
  public getInputs (): Iterable<PropertyDeclaration> {
    return [...this.classDeclaration.getProperties()]
      .filter(prop => prop.hasModifier(SyntaxKind.PublicKeyword))
  }

  @echoize()
  public getInputNames (): Iterable<string> {
    return [...this.getInputs()].map(prop => prop.getName())
  }

  @echoize()
  public getPropOrGetterType (propOrGetterName: string): Type {
    const prop = this.classDeclaration.getProperty(propOrGetterName)
    if (prop != null) {
      return prop.getType()
    }
    const getter = this.classDeclaration.getGetAccessor(propOrGetterName)
    if (getter != null) {
      return getter.getType()
    }
    throw new Error(`Expected to find prop or getter named "${propOrGetterName}".`)
  }

  @echoize()
  public getPropOrGetterOrMethodType (propOrMethodName: string): Type {
    const prop = [...this.getNamesOfAllPropsAndGetters()].find(p => p == propOrMethodName)
    if (prop != null) {
      return this.getPropOrGetterType(propOrMethodName)
    }
    const method = [...this.getNamesOfAllMethods()].find(m => m == propOrMethodName)
    if (method != null) {
      return this.classDeclaration.getMethodOrThrow(propOrMethodName).getType()
    }
    throw new Error(`Expected to find prop or getter or method named "${propOrMethodName}".`)
  }

  @echoize()
  public getInputType (inputName: string): Type {
    const input = [...this.getInputs()].find(input => input.getName() == inputName)
    if (input == null) {
      throw new Error(`Expected to find input "${inputName}" in "${this.getClassName()}".`)
    }
    return input.getType()
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
  public getMethodsCalledFrom (methodName: string): Set<string> {
    return getMethodsCalledFrom(this.classDeclaration, methodName)
  }

  @echoize()
  public getPropsWhichCanBeModifiedBy (methodName: string): Set<string> {
    return getPropsWhichCanBeModifiedBy(this.classDeclaration, methodName)
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

    const isInput = [...this.getInputNames()].includes(propName)

    return isInput || isGetter || canPropBeModified(this.classDeclaration, propName)
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

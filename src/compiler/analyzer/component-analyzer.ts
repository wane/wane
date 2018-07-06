import {
  ClassDeclaration,
  MethodDeclaration,
  SyntaxKind,
  NoSubstitutionTemplateLiteral,
  TypeGuards
} from 'ts-simple-ast'
import {ComponentTemplateAnalyzer} from './component-template-analyzer'
import {ViewBinding} from '../template-nodes/view-bindings'
import {TemplateNodeValue} from '../template-nodes/nodes/template-node-value-base'
import {canPropBeModified, getMethodsCalledFrom, getPropsWhichCanBeModifiedBy} from './utils'

export class ComponentAnalyzer {

  public readonly componentTemplateAnalyzer: ComponentTemplateAnalyzer
  public classDeclaration: ClassDeclaration

  constructor (classDeclaration: ClassDeclaration) {
    this.classDeclaration = classDeclaration
    this.componentTemplateAnalyzer = new ComponentTemplateAnalyzer(classDeclaration, this)
  }

  public getFilePath (): string {
    const sourceFile = this.classDeclaration.getSourceFile()
    const path = sourceFile.getFilePath()
    const fileName = sourceFile.getBaseNameWithoutExtension()
    return `${path}/${fileName}`
  }

  public getClassName (): string {
    return this.classDeclaration.getNameOrThrow()
  }

  public getFullName () {
    const sourceFile = this.classDeclaration.getSourceFile()
    const path = sourceFile.getFilePath()
    const fileName = sourceFile.getBaseNameWithoutExtension()
    const className = this.getClassName()
    return `${path}/${fileName}#${className}`
  }

  public getNamesOfAllPropsAndGetters (): Set<string> {
    return new Set([
      ...this.classDeclaration.getProperties(),
      ...this.classDeclaration.getGetAccessors(),
    ].map(x => x.getName()))
  }

  public getNamesOfAllMethods (): Set<string> {
    return new Set(this.classDeclaration.getMethods().map(x => x.getName()))
  }

  public getNamesOfInputs (): Iterable<string> {
    return [...this.classDeclaration.getProperties()]
      .filter(prop => prop.hasModifier(SyntaxKind.PublicKeyword))
      .map(prop => prop.getName())
  }

  public getMethodDeclaration (methodName: string): MethodDeclaration {
    return this.classDeclaration.getMethodOrThrow(methodName)
  }

  public getNamesOfPropertiesBoundToTemplate (): Set<ViewBinding<TemplateNodeValue>> {
    return this.componentTemplateAnalyzer.getNamesOfBoundProperties()
  }

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

  public getRegisteredComponentDeclaration (componentName: string): ClassDeclaration {
    for (const klass of this.getRegisteredComponentsDeclarations()) {
      if (klass.getName() == componentName) {
        return klass
      }
    }
    throw new Error(`Component "${componentName}" not registered in component "${this.getFullName()}".`)
  }

  public getMethodsCalledFrom (methodName: string): Set<string> {
    return getMethodsCalledFrom(this.classDeclaration, methodName)
  }

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
  public canPropBeModified (propName: string): boolean {
    const allGetters = this.classDeclaration.getGetAccessors()
      .map(getAccessor => getAccessor.getName())
    const isGetter = allGetters.includes(propName)

    const isInput = [...this.getNamesOfInputs()].includes(propName)

    return isInput || isGetter || canPropBeModified(this.classDeclaration, propName)
  }

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

  public hasStyles(): boolean {
    return this.getStyles() != null
  }

}

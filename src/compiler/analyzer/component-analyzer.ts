import { ClassDeclaration, MethodDeclaration } from 'ts-simple-ast'
import { ComponentTemplateAnalyzer } from './component-template-analyzer'
import { ViewBinding } from '../template-nodes/view-bindings'
import { TemplateNodeValue } from '../template-nodes/nodes/template-node-value-base'
import { getMethodsCalledFrom, getPropsWhichCanBeModifiedBy } from './utils'

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
      const className = klass.getText()
      const sourceFile = klass.getSourceFile()
      const classDeclarationInSameFile = sourceFile.getClass(className)
      if (classDeclarationInSameFile != null) {
        set.add(classDeclarationInSameFile)
      } else {
        // it's in different file so we look at imports and follow from there
        // TODO
        // const imports = sourceFile.getImportDeclarations()
        // imports.find(anImport => {
        //   const namedImports = anImport.getNamedImports()
        //   const theImport = namedImports.find(namedImport => namedImport.getName() == className)
        //   return true
        // })
      }
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

}

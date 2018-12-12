import {
  ClassDeclaration,
  ClassMemberTypes,
  ConstructorDeclaration,
  GetAccessorDeclaration,
  Identifier,
  KindToExpressionMappings,
  MethodDeclaration,
  ObjectLiteralExpression,
  Project,
  PropertyDeclaration,
  SyntaxKind,
  ts,
  TypeGuards,
  Block,
} from 'ts-simple-ast'
import * as path from 'path'
import {
  WtmlPhantomRootNode,
  WtmlComponentNode,
  WtmlInterpolationNode,
  WtmlElementNode,
  WtmlBracketedAttribute,
  WtmlParenthesisedAttribute,
} from '../../template-compiler/markup/tree-creator/wtml-nodes'
import { parseTemplate } from '../../template-compiler'
import { Predicate, Guard } from '../../libs/helper-types'
import { isInstance } from '../../libs/is-instance-ts'
import * as flow from './flow-analysis'
import { Queue } from '../../libs/stack'
import * as tg from 'type-guards'
import { BindingSyntaxTree } from '../../template-compiler/binding/tree-creator/trees'
import * as _ from 'lodash'


type NonConstructorClassMember = Exclude<ClassMemberTypes, ConstructorDeclaration>

const COMPONENT_DECORATOR_NAME = 'component'
const COMPONENT_TEMPLATE_KEY = 'template'
const COMPONENT_REGISTER_KEY = 'register'

type ComponentDecoratorPropKey = typeof COMPONENT_TEMPLATE_KEY | typeof COMPONENT_REGISTER_KEY

export class Io {

  protected project!: Project
  protected entry!: EntryComponentIoNode

  protected components = new Map<ClassDeclaration, ComponentIoNode>()

  constructor (protected absoluteRootPath: string) {
    this.initializeTsSimpleAstProject()
    this.loadEntryComponent()
    this.getEntryComponent().getRegisteredComponentClassDeclarations().forEach(classDeclaration => {
      this.loadFromClassDeclarationRecursively(classDeclaration)
    })
  }

  public getComponents (): Array<ComponentIoNode> {
    return [...this.components.values()]
  }

  public getComponent<T extends ComponentIoNode> (guard: Guard<ComponentIoNode, T>): T | undefined
  public getComponent (predicate: Predicate<ComponentIoNode>): ComponentIoNode | undefined
  public getComponent (classDeclaration: ClassDeclaration): ComponentIoNode | undefined
  public getComponent (className: string): ComponentIoNode | undefined
  public getComponent (arg: string | ClassDeclaration | Predicate<ComponentIoNode>): ComponentIoNode | undefined {
    if (arg instanceof ClassDeclaration) {
      return this.components.get(arg)
    }
    if (typeof arg == 'string') {
      return this.getComponents().find(component => {
        return component.getClassDeclaration().getName() == arg
      })
    }
    return this.getComponents().find(arg)
  }

  public getComponentOrThrow<T extends ComponentIoNode> (guard: Guard<ComponentIoNode, T>): T
  public getComponentOrThrow (predicate: Predicate<ComponentIoNode>): ComponentIoNode
  public getComponentOrThrow (classDeclaration: ClassDeclaration): ComponentIoNode
  public getComponentOrThrow (functionOrClassDeclaration: ClassDeclaration | Predicate<ComponentIoNode>): ComponentIoNode {
    const result = functionOrClassDeclaration instanceof ClassDeclaration
      ? this.getComponent(functionOrClassDeclaration)
      : this.getComponent(functionOrClassDeclaration) // lol ts wtf
    if (result == null) throw new Error(`Expected to find a component`)
    return result
  }

  /** @internal */
  public addComponentIfDoesntExist (classDeclaration: ClassDeclaration, component: ComponentIoNode): void {
    if (this.components.has(classDeclaration)) return
    this.components.set(classDeclaration, component)
  }

  public getEntryComponent (): EntryComponentIoNode {
    return this.entry
  }

  protected initializeTsSimpleAstProject () {
    this.project = new Project({
      compilerOptions: {
        target: ts.ScriptTarget.ESNext,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        strict: true,
      },
    })
    this.project.addExistingSourceFiles(this.toAbsolute('./src/**/*.ts'))
  }

  protected loadEntryComponent () {
    // The entry component is a default export from the ./src/index.ts file, relative from the root.
    const filename = this.toAbsolute('./src/index.ts')
    const file = this.project.getSourceFileOrThrow(filename)
    const defaultSymbol = file.getDefaultExportSymbolOrThrow()
    const valueDeclaration = defaultSymbol.getValueDeclarationOrThrow()
    if (!TypeGuards.isClassDeclaration(valueDeclaration)) throw new Error(`The default export from the entry file must be a class.`)
    this.entry = new EntryComponentIoNode(this, valueDeclaration)
    this.addComponentIfDoesntExist(valueDeclaration, this.entry)
  }

  protected loadFromClassDeclarationRecursively (classDeclaration: ClassDeclaration) {
    const component = this.loadFromClassDeclaration(classDeclaration)
    for (const registeredComponentClassDeclaration of component.getRegisteredComponentClassDeclarations()) {
      if (this.components.has(registeredComponentClassDeclaration)) continue
      this.loadFromClassDeclarationRecursively(registeredComponentClassDeclaration)
    }
  }

  protected loadFromClassDeclaration (classDeclaration: ClassDeclaration): ComponentIoNode {
    const component = new ComponentIoNode(this, classDeclaration)
    this.addComponentIfDoesntExist(classDeclaration, component)
    return component
  }

  private toAbsolute (relativePath: string) {
    return path.resolve(this.absoluteRootPath, relativePath)
  }

}

export class IoNode {

  constructor (protected io: Io) {
  }

}

export class ComponentIoNode extends IoNode {

  /**
   * @deprecated I don't think I need this
   */
  protected registeredInComponents: Array<ComponentIoNode> = []
  protected registeredComponentClassDeclarations = new Map<Identifier, ClassDeclaration>()
  protected registeredFormatters = new Map<Identifier, ComponentIoNode>()
  protected template!: TemplateIoNode
  protected members: Array<ComponentMemberIoNode> = []
  protected anchorTemplateNodes!: Array<WtmlComponentNode>

  constructor (io: Io, protected classDeclaration: ClassDeclaration, registeredInComponent?: ComponentIoNode) {
    super(io)
    this.assertDecorators()
    if (registeredInComponent != null) this.registeredInComponents.push(registeredInComponent)
    this.collectRegisteredComponents()
    this.collectMembers()
    this.collectTemplate()
  }

  public getClassDeclaration (): ClassDeclaration { return this.classDeclaration }

  // region Registered components

  public getRegisteredComponentClassDeclarations (): Array<ClassDeclaration> {
    return [...this.registeredComponentClassDeclarations.values()]
  }

  public getRegisteredComponentClassDeclarationByName (name: string): ClassDeclaration | undefined {
    for (const [identifier, classDeclaration] of this.registeredComponentClassDeclarations) {
      if (identifier.getText() == name) {
        return classDeclaration
      }
    }
    return undefined
  }

  // endregion Registered components

  // region Members

  public getMembers<T extends ComponentMemberIoNode> (guard: Guard<ComponentMemberIoNode, T>): Array<T>
  public getMembers (predicate: Predicate<ComponentMemberIoNode>): Array<ComponentMemberIoNode>
  public getMembers (): Array<ComponentMemberIoNode>
  public getMembers (fn?: Predicate<ComponentMemberIoNode>): Array<ComponentMemberIoNode> {
    if (fn == null) return this.members
    return this.members.filter(fn)
  }

  public getProperties<T extends ComponentPropertyIoNode> (guard: Guard<ComponentPropertyIoNode, T>): Array<T>
  public getProperties (predicate: Predicate<ComponentPropertyIoNode>): Array<ComponentPropertyIoNode>
  public getProperties (): Array<ComponentPropertyIoNode>
  public getProperties (predicateOrnNothing?: Predicate<ComponentPropertyIoNode>): Array<ComponentPropertyIoNode> {
    const fn = predicateOrnNothing == null ? () => true : predicateOrnNothing
    return this.getMembers(tg.fp.and(isInstance(ComponentPropertyIoNode), fn))
  }

  public getInputs<T extends ComponentInputIoNode> (guard: Guard<ComponentInputIoNode, T>): Array<T>
  public getInputs (predicate: Predicate<ComponentInputIoNode>): Array<ComponentInputIoNode>
  public getInputs (): Array<ComponentInputIoNode>
  public getInputs (predicateOrnNothing?: Predicate<ComponentInputIoNode>): Array<ComponentInputIoNode> {
    const fn = predicateOrnNothing == null ? () => true : predicateOrnNothing
    return this.getMembers(tg.fp.and(isInstance(ComponentInputIoNode), fn))
  }

  public getMethods<T extends ComponentMethodIoNode> (guard: Guard<ComponentMethodIoNode, T>): Array<T>
  public getMethods (predicate: Predicate<ComponentMethodIoNode>): Array<ComponentMethodIoNode>
  public getMethods (): Array<ComponentMethodIoNode>
  public getMethods (predicateOrnNothing?: Predicate<ComponentMethodIoNode>): Array<ComponentMethodIoNode> {
    const fn = predicateOrnNothing == null ? () => true : predicateOrnNothing
    return this.getMembers(tg.fp.and(isInstance(ComponentMethodIoNode), fn))
  }

  public getOutputs<T extends ComponentOutputIoNode> (guard: Guard<ComponentOutputIoNode, T>): Array<T>
  public getOutputs (predicate: Predicate<ComponentOutputIoNode>): Array<ComponentOutputIoNode>
  public getOutputs (): Array<ComponentOutputIoNode>
  public getOutputs (predicateOrnNothing?: Predicate<ComponentOutputIoNode>): Array<ComponentOutputIoNode> {
    const fn = predicateOrnNothing == null ? () => true : predicateOrnNothing
    return this.getMembers(tg.fp.and(isInstance(ComponentOutputIoNode), fn))
  }

  public getMember<T extends ComponentMemberIoNode> (guard: Guard<ComponentMemberIoNode, T>): T | undefined
  public getMember (predicate: Predicate<ComponentMemberIoNode>): ComponentMemberIoNode | undefined
  public getMember (name: string): ComponentMemberIoNode | undefined
  public getMember (nameOrFn: string | Predicate<ComponentMemberIoNode>): ComponentMemberIoNode | undefined {
    if (typeof nameOrFn == 'string') return this.getMember(member => member.getName() == nameOrFn)
    return this.members.find(nameOrFn)
  }

  public getMemberOrThrow<T extends ComponentMemberIoNode> (guard: Guard<ComponentMemberIoNode, T>): T
  public getMemberOrThrow (predicate: Predicate<ComponentMemberIoNode>): ComponentMemberIoNode
  public getMemberOrThrow (name: string): ComponentMemberIoNode
  public getMemberOrThrow (nameOrFn: string | Predicate<ComponentMemberIoNode>): ComponentMemberIoNode {
    const result = typeof nameOrFn == 'string' ? this.getMember(nameOrFn) : this.getMember(nameOrFn) // lol typescript wat
    // const result = this.getMember(nameOrFn)
    if (result == null) throw new Error(`Expected to find a member.`)
    return result
  }

  public getPropertyOrThrow (name: string): ComponentPropertyIoNode {
    return this.getMemberWithNameOrThrow(isInstance(ComponentPropertyIoNode), name)
  }

  public getInputOrThrow (name: string): ComponentInputIoNode {
    return this.getMemberWithNameOrThrow(isInstance(ComponentInputIoNode), name)
  }

  public getMethodOrThrow (name: string): ComponentMethodIoNode {
    return this.getMemberWithNameOrThrow(isInstance(ComponentMethodIoNode), name)
  }

  public getOutputOrThrow (name: string): ComponentOutputIoNode {
    return this.getMemberWithNameOrThrow(isInstance(ComponentOutputIoNode), name)
  }

  // endregion Members

  // region Template

  public getTemplate () {
    return this.template
  }

  // endregion Template

  // region Collectors

  protected collectRegisteredComponents () {
    // Components are registered by listing them in @component.register
    const propValue = this.getDecoratorPropertyValue(COMPONENT_REGISTER_KEY, SyntaxKind.ArrayLiteralExpression)

    // Registering is not obligatory.
    if (propValue == null) return

    // We go over each element in the array.
    const elements = propValue.getElements()
    for (const element of elements) {
      // Grab the class declaration based on the identifier in the array.
      if (!TypeGuards.isIdentifier(element)) throw new Error(`@component.register must contain identifiers.`)
      const classDeclaration = element.getDefinitionNodes().find(TypeGuards.isClassDeclaration)
      if (classDeclaration == null) throw new Error(`Elements of @component.register must refer to class declarations.`)

      this.registeredComponentClassDeclarations.set(element, classDeclaration)
    }
  }

  protected collectMembers () {
    for (const member of this.classDeclaration.getMembers()) {
      if (TypeGuards.isPropertyDeclaration(member)) {
        const isInput = member.getDecorator('input') != null
        if (isInput) {
          this.members.push(new ComponentInputIoNode(this.io, this, member))
        } else {
          this.members.push(new ComponentPropertyIoNode(this.io, this, member))
        }
      } else if (TypeGuards.isGetAccessorDeclaration(member)) {
        this.members.push(new ComponentGetterIoNode(this.io, this, member))
      } else if (TypeGuards.isMethodDeclaration(member)) {
        const isOutput = member.getDecorator('output') != null
        if (isOutput) {
          this.members.push(new ComponentOutputIoNode(this.io, this, member))
        } else {
          this.members.push(new ComponentMethodIoNode(this.io, this, member))
        }
      }
      // We ignore the constructor and setters.
    }
  }

  protected collectTemplate () {
    const templateLiteral = this.getDecoratorPropertyValue('template', SyntaxKind.NoSubstitutionTemplateLiteral)
    if (templateLiteral == null) throw new Error(`Every @component must have a template.`)
    this.template = new TemplateIoNode(this.io, templateLiteral.getLiteralValue())
  }

  // endregion Collectors

  protected assertDecorators () {
    const decorator = this.classDeclaration.getDecorator(COMPONENT_DECORATOR_NAME)
    if (decorator == null) throw new Error(`A component must be decorated with @component decorator factory.`)
    if (!decorator.isDecoratorFactory()) throw new Error(`The @component decorator must be a factory.`)
    const decoArgs = decorator.getArguments()
    if (decoArgs.length != 1) throw new Error(`The @component decorator must have exactly one argument.`)
    const decoArg = decoArgs[0]
    if (!TypeGuards.isObjectLiteralExpression(decoArg)) throw new Error(`The @component's argument must be a literal.`)
    const templateProp = decoArg.getProperty('template')
    if (templateProp == null) throw new Error(`Template must exist.`)
  }

  // region Utils

  private getDecoratorPropertyValue<TKind extends SyntaxKind> (
    propName: ComponentDecoratorPropKey,
    expectedType: TKind,
  ): KindToExpressionMappings[TKind] | undefined {
    const decorator = this.classDeclaration.getDecoratorOrThrow(COMPONENT_DECORATOR_NAME)
    const arg = decorator.getArguments()[0] as ObjectLiteralExpression
    const propAssignment = arg.getProperty(propName)
    if (propAssignment == null) return
    if (!TypeGuards.isPropertyAssignment(propAssignment)) throw new Error(`Expected @component decorator to contain a simple object.`)
    return propAssignment.getInitializerIfKind(expectedType)
  }

  private getMemberWithNameOrThrow<T extends ComponentMemberIoNode> (guard: Guard<ComponentMemberIoNode, T>, name: string): T {
    return this.getMemberOrThrow(tg.fp.and(guard, t => t.getName() == name))
  }

  // endregion Utils

}

export class EntryComponentIoNode extends ComponentIoNode {

  protected anchorTemplateNodes = []

}

export class FormatterIoNode extends IoNode {

}

export class TemplateIoNode extends IoNode {

  protected phantomRootNode: WtmlPhantomRootNode

  constructor (io: Io,
               protected fullText: string) {
    super(io)
    this.phantomRootNode = parseTemplate(fullText)
  }

  public getWtmlPhantomRoot () {
    return this.phantomRootNode
  }

  public getWtmlComponentNodes (): Array<WtmlComponentNode> {
    return this.phantomRootNode.filter(isInstance(WtmlComponentNode))
  }

  public getBindingSyntaxTrees () {
    const trees: Array<BindingSyntaxTree> = []

    this.phantomRootNode
      .filter(isInstance(WtmlInterpolationNode))
      .forEach(node => trees.push(node.getBindingSyntaxTree()))

    this.phantomRootNode
      .filter(isInstance(WtmlElementNode))
      .map(el => el.getAttributes(tg.fp.or(isInstance(WtmlBracketedAttribute), isInstance(WtmlParenthesisedAttribute))))
      .reduce((acc, curr) => [...acc, ...curr], [])
      .forEach(attr => trees.push(attr.getBindingSyntaxTree()))

    return trees
  }

  public getUsedMembers () {
    const result = this.getBindingSyntaxTrees()
      .map(tree => tree.getUsedMembers())
      .reduce((acc, curr) => [...acc, ...curr], [])
    return _.uniqBy(result, item => item.getData())
  }

  public getUsedMemberNames () { return this.getUsedMembers().map(m => m.getData()) }

}

export class ComponentMemberIoNode<T extends NonConstructorClassMember = NonConstructorClassMember> extends IoNode {

  constructor (io: Io,
               protected component: ComponentIoNode,
               protected member: T) {
    super(io)
  }

  public getName () {
    return this.member.getName()
  }

}

export class ComponentPropertyIoNode extends ComponentMemberIoNode<PropertyDeclaration> {

}

export class ComponentGetterIoNode extends ComponentMemberIoNode<GetAccessorDeclaration> {

}


export class ComponentInputIoNode extends ComponentPropertyIoNode {

  public isRequired (): boolean {
    return !!this.member.getStructure().hasExclamationToken
  }

}

export class ComponentMethodIoNode extends ComponentMemberIoNode<MethodDeclaration> {

  public getCalledMethods (): Array<ComponentMethodIoNode> {
    const result: Array<ComponentMethodIoNode> = []
    const visited = new Set<ComponentMethodIoNode>()
    const queue = new Queue<ComponentMethodIoNode>()

    visited.add(this)
    queue.push(this)

    while (queue.isNotEmpty()) {
      const current = queue.pop()
      const methods = current.getDirectlyCalledMethods()

      for (const method of methods) {
        if (visited.has(method)) continue
        result.push(method)
        visited.add(method)
        queue.push(method)
      }
    }

    return result
  }

  public getCalledOutputs (): Array<ComponentOutputIoNode> {
    return this.getCalledMethods().filter(isInstance(ComponentOutputIoNode))
  }

  public getModifiedProperties (): Array<ComponentPropertyIoNode> {
    const result = new Set<ComponentPropertyIoNode>()

    // directly
    const props = this.getDirectlyModifiedProperties()
    for (const prop of props) result.add(prop)

    // indirectly
    const calledMethods = this.getCalledMethods()
    for (const calledMethod of calledMethods) {
      const props = calledMethod.getDirectlyModifiedProperties()
      for (const prop of props) result.add(prop)
    }

    return [...result]
  }

  public getModifiedInputs (): Array<ComponentInputIoNode> {
    return this.getModifiedProperties().filter(isInstance(ComponentInputIoNode))
  }

  protected getDirectlyModifiedProperties (): Array<ComponentPropertyIoNode> {
    const body = this.getBodyBlock()
    const names = flow.getDirectlyModifiedMemberNamesFromBlock(body)
    return names.map(name => this.component.getPropertyOrThrow(name))
  }

  protected getDirectlyCalledMethods (): Array<ComponentMethodIoNode> {
    const body = this.getBodyBlock()
    const names = flow.getDirectlyCalledMethodNamesFromBlock(body)
    return names.map(name => this.component.getMethodOrThrow(name))
  }

  protected getBodyBlock (): Block {
    const body = this.member.getBodyOrThrow()
    if (!TypeGuards.isBlock(body)) throw new Error(`Unexpected error. Please create an issue`)
    return body
  }

}

export class ComponentOutputIoNode extends ComponentMethodIoNode {

}
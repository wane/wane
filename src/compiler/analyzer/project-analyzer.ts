import Project, { ClassDeclaration, SourceFile, TypeGuards } from 'ts-simple-ast'
import { Forest, TreeNode } from '../utils/tree'
import { ComponentAnalyzer } from './component-analyzer'
import { FactoryAnalyzer } from './factory-analyzer/base-factory-analyzer'
import { ComponentFactoryAnalyzer } from './factory-analyzer/component-factory-analyzer'
import { ConditionalViewFactoryAnalyzer } from './factory-analyzer/conditional-view-factory-analyzer'
import { counter } from '../utils/counter'
import { RepeatingViewFactoryAnalyzer } from './factory-analyzer/repeating-view-factory-analyzer'
import { TemplateNodeValue } from '../template-nodes/nodes/template-node-value-base'
import { isInstance } from '../utils/utils'
import { TemplateNodeComponentValue } from '../template-nodes/nodes/component-node'
import { TemplateNodeConditionalViewValue } from '../template-nodes/nodes/conditional-view-node'
import { TemplateNodeRepeatingViewValue } from '../template-nodes/nodes/repeating-view-node'
import { WaneCompilerOptions } from '../compile'
import { PartialViewFactoryAnalyzer } from './factory-analyzer/partial-view-factory-analyzer'
import { oneLine } from 'common-tags'
import * as path from 'path'

function spaces (n: number, space: string = '~') {
  return Array.from({ length: n }).fill(space).join('')
}

export class ProjectAnalyzer {

  // every factory compiler node has a unique number
  private counter = counter()

  private readonly _sourceFiles: SourceFile[]

  constructor (private tsSimpleAstProject: Project,
               public compilerOptions: WaneCompilerOptions) {
    this._sourceFiles = tsSimpleAstProject.getSourceFiles()
  }

  public getProject (): Project {
    return this.tsSimpleAstProject
  }

  /**
   * Entry component is a default export from the src/index.ts file.
   */
  public getEntryComponentDeclaration (): ClassDeclaration {
    const entryFilePath = path.join(this.compilerOptions.output, 'index.ts')
    const entryFile = this.getProject().getSourceFile(entryFilePath)
    if (entryFile == null) {
      throw new Error(`The entry file (src/index.ts) not found.`)
    }

    const defaultExportSymbol = entryFile.getDefaultExportSymbol()
    if (defaultExportSymbol == null) {
      throw new Error(`The entry file (src/index.ts) must have a default export.`)
    }
    const declarations = defaultExportSymbol.getDeclarations()

    if (declarations.length == 0) {
      throw new Error(oneLine`No declarations found for the exported
        symbol ${defaultExportSymbol.getName()}.`)
    }

    const classDeclaration = declarations.find(TypeGuards.isClassDeclaration)
    if (classDeclaration == null) {
      throw new Error(oneLine`The default export from the entry file is not a class.`)
    }

    return classDeclaration
  }

  private _componentAnalyzers = new Map<ClassDeclaration, ComponentAnalyzer>()

  public getComponentAnalyzerByClassDeclaration (classDeclaration: ClassDeclaration): ComponentAnalyzer {
    const result = this._componentAnalyzers.get(classDeclaration)
    if (result == null) {
      const compilerNode = new ComponentAnalyzer(this, classDeclaration)
      this._componentAnalyzers.set(classDeclaration, compilerNode)
      return compilerNode
    } else {
      return result
    }
  }

  private getRegisteredComponentsDeclarationsFor (component: ClassDeclaration): Iterable<ClassDeclaration> {
    const componentCompilerNode = this.getComponentAnalyzerByClassDeclaration(component)
    const map = componentCompilerNode.getRegisteredComponentsDeclarations()
    return map.values()
  }

  private getRegisteredComponentsDeclarationsRecursivelyIn (component: ClassDeclaration): Set<ClassDeclaration> {
    const result = new Set<ClassDeclaration>([component])
    const registered = this.getRegisteredComponentsDeclarationsFor(component)

    for (const r of registered) {
      result.add(r)
    }

    for (const child of registered) {
      const innerRegistered = this.getRegisteredComponentsDeclarationsRecursivelyIn(child)
      innerRegistered.forEach(r => result.add(r))
    }

    return result
  }

  public getAllRegisteredComponentsDeclarations (): Set<ClassDeclaration> {
    return this.getRegisteredComponentsDeclarationsRecursivelyIn(this.getEntryComponentDeclaration())
  }

  public getAllComponentAnalyzers (): Set<ComponentAnalyzer> {
    const result = new Set<ComponentAnalyzer>()
    const tree = this.getFactoryTree()
    const queue: FactoryAnalyzer<TemplateNodeValue>[] = [tree]
    while (queue.length > 0) {
      const current = queue.pop()!
      queue.push(...[...current.getChildrenFactories()])
      if (current instanceof ComponentFactoryAnalyzer) {
        result.add(current.componentAnalyzer)
      }
    }
    return result
  }

  private factoryNodeIndentation = 0
  private templateNodeIndentation = 0

  private get totalIndentation () {
    return this.factoryNodeIndentation = this.templateNodeIndentation
  }

  private _processTemplateNode (
    responsibleFactory: FactoryAnalyzer<TemplateNodeValue>,
    templateNode: TreeNode<TemplateNodeValue>,
    parentViewNode: TreeNode<TemplateNodeValue> | null,
    definitionFactory: ComponentFactoryAnalyzer,
  ): void {
    this.templateNodeIndentation++

    const value = templateNode.getValueOrThrow()
    // console.log(`${spaces(this.totalIndentation)}${value.toString()}`)

    const viewNode = new TreeNode(value)
    if (parentViewNode != null) {
      responsibleFactory.view.findValueOrFail(v => v == parentViewNode.getValue()).appendChild(viewNode)
    }

    if (value.isPureDom) {
      for (const templateNodeChild of templateNode.getChildren()) {
        this._processTemplateNode(responsibleFactory, templateNodeChild, viewNode, definitionFactory)
      }
    } else {
      if (isInstance(TemplateNodeComponentValue)(value)) {
        const componentClassName: string = (viewNode.getValueOrThrow() as TemplateNodeComponentValue).getRegisteredName()
        const componentDeclaration = definitionFactory.componentAnalyzer.getRegisteredClassDeclarationOrThrow(componentClassName)
        const componentCompilerNode = new ComponentAnalyzer(this, componentDeclaration)
        const childFactory = new ComponentFactoryAnalyzer(
          this,
          this.counter.next().value,
          responsibleFactory,
          viewNode as TreeNode<TemplateNodeComponentValue>,
          componentCompilerNode,
        )
        responsibleFactory.registerChild(viewNode, childFactory)
        this._generateFactoryTree(childFactory, definitionFactory)
      } else if (isInstance(TemplateNodeConditionalViewValue)(value)) {
        const partialView = new PartialViewFactoryAnalyzer(
          this,
          this.counter.next().value,
          new Forest(templateNode.getChildren()),
        )
        const childFactory = new ConditionalViewFactoryAnalyzer(
          this,
          this.counter.next().value,
          responsibleFactory,
          viewNode as TreeNode<TemplateNodeConditionalViewValue>,
          new Forest(templateNode.getChildren()),
          partialView,
        )
        responsibleFactory.registerChild(viewNode, childFactory)
        this._generateFactoryTree(partialView, definitionFactory)
      } else if (isInstance(TemplateNodeRepeatingViewValue)(value)) {
        const partialView = new PartialViewFactoryAnalyzer(
          this,
          this.counter.next().value,
          new Forest(templateNode.getChildren()),
        )
        const childFactory = new RepeatingViewFactoryAnalyzer(
          this,
          this.counter.next().value,
          responsibleFactory,
          viewNode as TreeNode<TemplateNodeRepeatingViewValue>,
          new Forest(templateNode.getChildren()),
          partialView,
        )
        responsibleFactory.registerChild(viewNode, childFactory)
        this._generateFactoryTree(partialView, definitionFactory)
      } else {
        throw new Error(`Unsupported type of TemplateNodeValue.`)
      }
    }

    this.templateNodeIndentation--
  }

  private _generateFactoryTree (
    responsibleFactory: FactoryAnalyzer<TemplateNodeValue>,
    definitionFactory: ComponentFactoryAnalyzer,
  ) {
    this.factoryNodeIndentation++
    // console.log(`${spaces(this.totalIndentation)}_generateFactoryTree(${responsibleFactory.getFactoryName()}, ${definitionFactory.getFactoryName()})`)
    const roots = responsibleFactory.templateDefinition.getRoots()
    const onlyRoots = Array.from(roots)
      .map(root => root.getValueOrThrow())
      .map(value => new TreeNode(value))
    responsibleFactory.view = new Forest(onlyRoots)
    for (const root of roots) {
      this._processTemplateNode(responsibleFactory, root, null, definitionFactory)
    }
    for (const node of responsibleFactory.view) {
      node.getValueOrThrow().registerResponsibleFactory(responsibleFactory.getPartialViewFactoryAnalyzer())
    }
    this.factoryNodeIndentation--
  }

  private _factoryTree: ComponentFactoryAnalyzer | undefined

  // This function must not be called twice because it runs the initialization logic.
  // Hence the "caching" part is not the performance optimization, but a necessary
  // logic which will break things if removed.
  // TODO: it should be run automatically from the constructor, and the method should
  // TODO: be just a getter for it.
  public getFactoryTree (): ComponentFactoryAnalyzer {
    if (this._factoryTree != null) {
      return this._factoryTree
    }

    const entryComponentCompilerNode = new ComponentAnalyzer(this, this.getEntryComponentDeclaration())
    const entryFactory = new ComponentFactoryAnalyzer(
      this,
      this.counter.next().value,
      undefined,
      undefined,
      entryComponentCompilerNode,
    )

    this._generateFactoryTree(entryFactory, entryFactory)
    this._factoryTree = entryFactory

    for (const componentFactory of this.getComponentFactoryAnalyzers()) {
      const templateAnalyzer = componentFactory.componentAnalyzer.componentTemplateAnalyzer
      templateAnalyzer.checkRequiredInputsInComponents()
    }

    return this._factoryTree
  }

  public factories () {
    const rootFa = this.getFactoryTree()
    return {
      * [Symbol.iterator] () {
        yield rootFa
        const queue = Array.from(rootFa.getChildrenFactories())
        while (queue.length > 0) {
          const current = queue.shift()!
          yield current
          for (const child of current.getChildrenFactories()) {
            queue.push(child)
          }
        }
      },
    }
  }

  public getComponentFactoryAnalyzers(): Iterable<ComponentFactoryAnalyzer> {
    return [...this.factories()].filter(isInstance(ComponentFactoryAnalyzer))
  }

  public getFactoryByName (factoryName: string): FactoryAnalyzer<TemplateNodeValue> {
    for (const factory of this.factories()) {
      if (factory.getFactoryName() == factoryName) {
        return factory
      }
    }
    throw new Error(`Factory with name ${factoryName} not found.`)
  }

  // public getComponentAnalyzerByClassDeclaration (classDeclaration: ClassDeclaration): ComponentAnalyzer {
  //   for (const factory of this.factories()) {
  //     if (factory instanceof ComponentFactoryAnalyzer) {
  //       const { componentAnalyzer } = factory
  //       if (componentAnalyzer.classDeclaration == classDeclaration) {
  //         return componentAnalyzer
  //       }
  //     }
  //   }
  //   throw new Error(`Factory could not be found by the specified declaration.`)
  // }

}

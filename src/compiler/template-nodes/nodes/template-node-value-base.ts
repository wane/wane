import { FactoryAnalyzer } from '../../analyzer'
import { ViewBinding } from '../view-bindings'
import * as himalaya from '../../template-parser/html/himalaya'

export abstract class TemplateNodeValue {

  public abstract domNodesCount: number

  protected responsibleFactory?: FactoryAnalyzer<TemplateNodeValue>
  public abstract readonly isPureDom: boolean

  constructor (private _viewBindings: Iterable<ViewBinding<TemplateNodeValue>>,
               protected originalTemplateNode: himalaya.Node) {
    this.registerThisToViewBindings()
  }

  private registerThisToViewBindings () {
    for (const viewBinding of this._viewBindings) {
      viewBinding.registerTemplateNode(this)
    }
  }

  public get viewBindings (): Iterable<ViewBinding<this>> {
    return this._viewBindings as Iterable<ViewBinding<this>>
  }

  public registerResponsibleFactory (fa: FactoryAnalyzer<TemplateNodeValue>): void {
    if (this.responsibleFactory == fa) {
      return
    }
    if (this.responsibleFactory != null) {
      throw new Error(`Responsible factory already set to "${this.responsibleFactory.getFactoryName()}" for node "${this.toString()}". It cannot be changed to "${fa.getFactoryName()}".`)
    }
    this.responsibleFactory = fa
  }

  public getResponsibleFactory (): FactoryAnalyzer<TemplateNodeValue> {
    if (this.responsibleFactory == null) {
      throw new Error(`Responsible factory has not yet been set for TemplateNodeValue "${this.toString()}".`)
    }
    return this.responsibleFactory
  }

  public getIndexes (): number[] {
    return this.getResponsibleFactory().getIndexesFor(this)
  }

  public getSingleIndex (): number {
    return this.getResponsibleFactory().getSingleIndexFor(this)
  }

  public abstract printDomInit (from: FactoryAnalyzer<TemplateNodeValue>): string[]

  public abstract toString (): string

  public resolveAccessToDomNodes (from: FactoryAnalyzer<TemplateNodeValue>): string[] {
    const to = this.getResponsibleFactory()
    const path = from.printPathTo(to)
    const results: string[] = []
    for (const index of this.getIndexes()) {
      results.push(`${path}.__wane__domNodes[${index}]`)
    }
    return results
  }

  public resolveAccessToSingleDomNode (from: FactoryAnalyzer<TemplateNodeValue>): string {
    const result = this.resolveAccessToDomNodes(from)
    if (result.length != 1) {
      throw new Error(`Expected length to to be 1.`)
    }
    return result[0]
  }

  public getFactoryWhichThisIsAnchorFor (): FactoryAnalyzer<TemplateNodeValue> {
    const responsibleFactory = this.getResponsibleFactory()
    const treeNode = responsibleFactory.view.find(t => t.getValueOrThrow() == this)
    if (treeNode == null) {
      throw new Error(`Expected to find tree node.`)
    }
    const childFactory = [...responsibleFactory.getChildrenFactories()].find(f => {
      return f.getAnchorViewNode().getValueOrThrow() == treeNode.getValueOrThrow()
    })
    if (childFactory == null) {
      throw new Error(`Expected to find child factory.`)
    }
    return childFactory
  }

}

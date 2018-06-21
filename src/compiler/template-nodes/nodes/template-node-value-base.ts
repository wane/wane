import { FactoryAnalyzer } from '../../analyzer'
import CodeBlockWriter from 'code-block-writer'
import { ViewBinding } from '../view-bindings'
import * as himalaya from 'himalaya'

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

}

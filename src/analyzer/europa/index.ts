import { InterpolationTree } from '../../template-compiler/binding-parser/ast'
import { Project, ts } from 'ts-simple-ast'

class Europa {

  protected project!: Project
  protected entry!: Component

  constructor (protected absoluteRootPath: string) {
    this.initializeTsSimpleAstProject()
    this.loadEntryComponent()
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
  }

  protected loadEntryComponent () {

  }

}

class EuropaNode {

}

class Directive extends EuropaNode {

  protected anchorTemplateNodes!: Array<DirectiveTemplateNode>

}

class Component extends Directive {

  protected registeredComponents: Array<Component> = []
  protected registeredFormatters: Array<Component> = []
  protected template!: ComponentTemplate
  protected methods: Array<ComponentMethod> = []
  protected properties: Array<ComponentProperty> = []
  protected getters: Array<ComponentGetter> = []
  protected inputs: Array<ComponentInput> = []
  protected outputs: Array<ComponentOutput> = []
  protected anchorTemplateNodes!: Array<ComponentTemplateNode>

}

class EntryComponent extends Component {

  protected anchorTemplateNodes = []

}

class StructuralDirective extends Directive {

}

class ConditionalStructuralDirective extends StructuralDirective {

}

class RepeatingStructuralDirective extends StructuralDirective {

}

class RoutingStructuralDirective extends StructuralDirective {

}

class Formatter extends EuropaNode {

}

class Template extends EuropaNode {

  private root: /*TemplateTree*/ any

}

class ComponentTemplate extends Template {

}

class DirectiveTemplate extends Template {

}

class ComponentMember extends EuropaNode {


}

class ComponentProperty extends ComponentMember {

}

class ComponentGetter extends ComponentMember {

  public foo () {}

}


class ComponentInput extends ComponentProperty {

  protected component!: Component

  public hasDefaultValue (): boolean { throw ''}

  public isNeverUsed (): boolean { throw '' }

}

class ComponentMethod extends ComponentMember {

}

class ComponentOutput extends ComponentMember {

  public isNeverUsed (): boolean { throw '' }

}

// Template

class WaneTemplateNode {

  public getRoot (): TemplateRoot { throw '' }

  public

}

class TemplateRoot extends WaneTemplateNode {

}

class ComponentTemplateRoot extends TemplateRoot {

  protected component!: Component

}

class DirectiveTemplateRoot extends TemplateRoot {

  protected directive!: Directive

}

class TextTemplateNode extends WaneTemplateNode {

  private data!: string

}

class InterpolationTemplateNode extends WaneTemplateNode {

  private binding!: InterpolationTree

}

class ElementTemplateNode extends WaneTemplateNode {

}

class DirectiveTemplateNode extends WaneTemplateNode {

}

class ComponentTemplateNode extends DirectiveTemplateNode {

  private component!: Component

}

class ConditionalTemplateNode extends DirectiveTemplateNode {

}

class RepeatingTemplateNode extends DirectiveTemplateNode {

}

class RoutingTemplateNode extends DirectiveTemplateNode {

}

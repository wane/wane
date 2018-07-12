import {ViewBinding} from '../template-nodes/view-bindings'
import {TemplateNodeValue} from '../template-nodes/nodes/template-node-value-base'
import Project from 'ts-simple-ast'
import {ProjectAnalyzer} from './project-analyzer'
import {prettyPrintError} from './utils/type-checker'

export class TemplateTypeCheckAtom {

  private message: string | undefined = undefined

  private get isOk (): boolean {
    return this.message != undefined
  }

  constructor (
    private binding: ViewBinding<TemplateNodeValue>,
  ) {
  }

  private buildMessage (typeScriptError: string): string {
    const fa = this.binding.getDefinitionFactory().getFactoryName()
    const node = this.binding.getTemplateNode()
    const preamble = `Error in template of "${fa}", at ${this.binding.toString()}.`
    return `${preamble}\n${typeScriptError}`
  }

  public getExpectedType () {
    return this.binding.getExpectedType()
  }

  public getActualType () {
    return this.binding.boundValue.getType()
  }

  public setStatus (message: string): void {
    this.message = message
  }

  public getErrorOrNull (): string | null {
    if (this.message == null) return null
    return this.buildMessage(this.message)
  }

}

const FILENAME = '__a_stupid_way_to_type_check__.ts'

function getLineNumber (string: string, pos: number): number {
  let lineNumber = 0
  for (let i = 0; i < string.length; i++) {
    if (i == pos) return lineNumber
    if (string[i] == '\n') lineNumber++
  }
  return -1
}

function typeCheckAll (project: Project, atoms: Array<TemplateTypeCheckAtom>): boolean {
  let content: string = ''

  for (let i = 0; i < atoms.length; i++) {
    const atom = atoms[i]
    const expectedType = atom.getExpectedType()
    const actualType = atom.getActualType()

    content += `const a_${i}: ${expectedType} = 0 as any as ${actualType}\n`
  }

  console.log(`===`)
  console.log(content)
  const file = project.createSourceFile(FILENAME, content, {overwrite: true})
  const diagnostics = file.getDiagnostics()

  for (const diagnostic of diagnostics) {
    const start = diagnostic.getStart()
    if (start == null) {
      throw new Error(`Cannot determine placement of diagnostic.`)
    }
    const line = getLineNumber(content, start)
    const atom = atoms[line]
    if (atom == null) {
      throw new Error(`Expected to find atom at index ${line}.`)
    }
    const prettyError = prettyPrintError(diagnostic.getMessageText())
    atom.setStatus(prettyError)
  }

  file.deleteImmediatelySync()

  return diagnostics.length == 0
}

export function typeCheckTemplatesInProject (projectAnalyzer: ProjectAnalyzer): string[] {
  const atoms: TemplateTypeCheckAtom[] = []
  const allFactories = projectAnalyzer.getAllFactories()

  for (const factory of allFactories) {
    for (const node of factory.view) {
      const value = node.getValueOrThrow()
      const viewBindings = value.viewBindings
      for (const viewBinding of viewBindings) {

        const atom = new TemplateTypeCheckAtom(viewBinding)
        atoms.push(atom)
      }
    }
  }

  const project = projectAnalyzer.getProject()
  const isOk = typeCheckAll(project, atoms)

  if (isOk) {
    return []
  }

  const errors: string[] = []
  for (const atom of atoms) {
    const error = atom.getErrorOrNull()
    if (error != null) {
      errors.push(error)
    }
  }

  return errors
}

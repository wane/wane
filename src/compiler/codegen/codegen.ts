import * as path from 'path'
import * as del from 'del'
import * as fs from 'fs'
import chalk from 'chalk'
import { rollup } from 'rollup'
import CodeBlockWriter from 'code-block-writer'
import { FactoryAnalyzer, ProjectAnalyzer } from '../analyzer'
import { ComponentFactoryCodegen } from './component-factory-codegen/component-factory-codegen'
import { ConditionalViewFactoryCodegen } from './conditional-view-factory-codegen/conditional-view-factory-codegen'
import { RepeatingViewFactoryCodegen } from './repeating-view-factory-codegen/repeating-view-factory-codegen'
import { HelpersCodegen } from './helpers-codegen/helpers-codegen'
import { BootstrapCodegen } from './bootstrap-codegen/bootstrap-codegen'
import { Project, SyntaxKind } from 'ts-simple-ast'
import { ComponentFactoryAnalyzer } from '../analyzer/factory-analyzer/component-factory-analyzer'
import { ConditionalViewFactoryAnalyzer } from '../analyzer/factory-analyzer/conditional-view-factory-analyzer'
import { RepeatingViewFactoryAnalyzer } from '../analyzer/factory-analyzer/repeating-view-factory-analyzer'
import { TemplateNodeValue } from '../template-nodes/nodes/template-node-value-base'
import * as rollupPluginUglify from 'rollup-plugin-uglify'
import { WaneCompilerOptions } from '../compile'
import { PartialViewFactoryCodegen } from './partial-view-codegen/partial-view-factory-codegen'
import { PartialViewFactoryAnalyzer } from '../analyzer/factory-analyzer/partial-view-factory-analyzer'
import { StyleCodegen } from './style-codegen/style-codegen'
import { ConstantsCodegen } from './constants-codegen'
import { wrapAsyncCode } from './wrap-async-code'
import { getPropNamesWhichCanBeModifiedBy } from '../analyzer/utils'
import { ComponentAnalyzer } from '../analyzer/component-analyzer'

type Constructor<T> = {
  new (
    writerOptions: any,
    waneCompilerOptions: WaneCompilerOptions,
    styleCodegen: StyleCodegen,
    constantsCodegen: ConstantsCodegen,
  ): T
}

export interface CodegenResult {
  filesRoot: string
  files: string[]
}

export class Codegen {

  private distDirectory: string

  constructor (
    private analyzer: ProjectAnalyzer,
    private waneCompilerOptions: WaneCompilerOptions,
  ) {
    this.project = analyzer.getProject()
    this.codegen = {
      helpers: this.createCodegen(HelpersCodegen),
      bootstrap: this.createCodegen(BootstrapCodegen),
      component: this.createCodegen(ComponentFactoryCodegen),
      partialView: this.createCodegen(PartialViewFactoryCodegen),
      conditionalView: this.createCodegen(ConditionalViewFactoryCodegen),
      repeatingView: this.createCodegen(RepeatingViewFactoryCodegen),
    }
    this.distDirectory = this.waneCompilerOptions.output
  }

  public async generateCode (): Promise<CodegenResult> {
    const factoryTree = this.analyzer.getFactoryTree()

    this
      .createTsProjectFile('util.ts', this.codegen.helpers.printCode())
      .createTsProjectFile('bootstrap.ts', this.codegen.bootstrap.printCode(factoryTree))
      .createTsProjectFile('main.ts', this.generateMainJsFile())
      .preProcessComponents()
      .generateFactories(factoryTree)
      .createTsProjectFile('constants.ts', this.constantsCodegen.toString())
      .createFileOnDisk('styles.css', this.styleCodegen.getStyle())
      .postProcessComponents()
      .saveAll()
      .emit()
      .deleteAll()
      .then(() => {
        this.saveAll()
      })

    await this.bundle()

    return {
      filesRoot: this.distDirectory,
      files: ['index.js', 'styles.css'],
    }
  }

  private project: Project

  private writerOptions = {
    newLine: '\n',
    useTabs: false,
    indentNumberOfSpaces: 2,
    useSingleQuote: true,
  }

  private styleCodegen: StyleCodegen = new StyleCodegen()
  private constantsCodegen: ConstantsCodegen = new ConstantsCodegen()
  private codegen: {
    helpers: HelpersCodegen,
    bootstrap: BootstrapCodegen,
    component: ComponentFactoryCodegen,
    partialView: PartialViewFactoryCodegen,
    conditionalView: ConditionalViewFactoryCodegen,
    repeatingView: RepeatingViewFactoryCodegen,
  }

  private createCodegen<T> (codegen: Constructor<T>): T {
    return new codegen(
      this.writerOptions,
      this.waneCompilerOptions,
      this.styleCodegen,
      this.constantsCodegen,
    )
  }

  private createTsProjectFile (filePath: string, writerOrString: CodeBlockWriter | string): this {
    const content = writerOrString.toString()
    const fullFilePath = path.join(path.relative(process.cwd(), this.distDirectory), filePath)
    this.project.createSourceFile(fullFilePath, content)
    // console.log(`Created project file ${fullFilePath}: "${content.slice(0, 80).replace(/\s+/g, ' ')}..."`)
    return this
  }

  private createFileOnDisk (filePath: string, content: string): this {
    const fullFilePath = path.join(this.distDirectory, filePath)
    fs.writeFileSync(fullFilePath, content, { encoding: 'utf8' })
    // console.log(`Created file on disk ${fullFilePath}: "${content.slice(0, 80).replace(/\s+/g, ' ')}..."`)
    return this
  }

  private generateFactories (factory: FactoryAnalyzer<TemplateNodeValue>): this {
    let writer: CodeBlockWriter
    if (factory instanceof ComponentFactoryAnalyzer) {
      writer = this.codegen.component.printCode(factory)
    } else if (factory instanceof ConditionalViewFactoryAnalyzer) {
      writer = this.codegen.conditionalView.printCode(factory)
    } else if (factory instanceof RepeatingViewFactoryAnalyzer) {
      writer = this.codegen.repeatingView.printCode(factory)
    } else if (factory instanceof PartialViewFactoryAnalyzer) {
      writer = this.codegen.partialView.printCode(factory)
    } else {
      throw new Error(`Unknown type of FactoryAnalyzer.`)
    }

    this.createTsProjectFile(factory.getFactoryFilenameWithExtension(), writer)

    factory.getChildren().forEach(childFactory => {
      this.generateFactories(childFactory)
    })

    return this
  }

  /**
   * (1) Remove props which are copied to the constants file.
   * (2) Replace all usages of those props so the code still references the correct value.
   * (3) In order to be able to access components, we need to the import the constants file.
   */
  private handleConstants (componentAnalyzer: ComponentAnalyzer) {
    const declaration = componentAnalyzer.classDeclaration

    // (1)
    const propsToRemove = [...componentAnalyzer.getAllConstants()]
    declaration
      .getProperties()
      .filter(prop => propsToRemove.includes(prop.getName()))
      .forEach(propDeclaration => {
        propDeclaration.remove()
      })

    // (2)
    declaration
      .getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
      .reverse()
      .forEach(propertyAccessExpression => {
        const expression = propertyAccessExpression.getExpression()
        const name = propertyAccessExpression.getName()
        if (expression.getKind() != SyntaxKind.ThisKeyword) return
        if (propsToRemove.includes(name)) {
          const constantName = componentAnalyzer.getConstantName(name)
          const replacement = `__wane__constants.${constantName}`
          propertyAccessExpression.replaceWithText(replacement)
        }
      })

    // (3)
    declaration
      .getSourceFile()
      .insertImportDeclaration(0, {
        moduleSpecifier: './constants.js',
        namespaceImport: '__wane__constants',
      })
  }

  private postProcessComponents (): this {
    this.analyzer
      .getAllComponentAnalyzers()
      .forEach(componentAnalyzer => {
        const declaration = componentAnalyzer.classDeclaration

        // Strip decorators
        declaration
          .getDescendantsOfKind(SyntaxKind.Decorator)
          .forEach(decorator => {
            decorator.remove()
          })

        this.handleConstants(componentAnalyzer)

        // Export classes if they are not exported so they can be consumed
        // by other parts of code.
        if (!declaration.isExported()) {
          declaration.setIsExported(true)
        }
      })
    return this
  }

  private preProcessComponents (): this {
    this.analyzer
      .getAllComponentAnalyzers()
      .forEach((componentAnalyzer, index) => {
        const declaration = componentAnalyzer.classDeclaration

        // Inject lines for async code
        wrapAsyncCode(declaration, (block, index) => writer => {
          const propNamesWhichCanBeModified = getPropNamesWhichCanBeModifiedBy(block)
          if (propNamesWhichCanBeModified.size == 0) {
            return false
          } else {
            const syntaxList = block.getFirstAncestorByKindOrThrow(SyntaxKind.SyntaxList)
            componentAnalyzer.registerAsyncBlockWhichCausesUpdate(index, syntaxList)
            writer.writeLine(`this.__wane__factory.__wane__updateAsync[${index}]()`)
            return true
          }
        })

      })

    return this
  }

  private generateMainJsFile (): CodeBlockWriter {
    const writer = new CodeBlockWriter(this.writerOptions)
    writer
      .writeLine(`import app from './bootstrap'`)
      .writeLine(`app.__wane__init()`)
    return writer
  }

  private saveAll (): this {
    this.project.save()
    return this
  }

  private emit (): this {
    this.project.emit()
    return this
  }

  private async deleteAll (): Promise<this> {
    this.project.getSourceFiles().forEach(file => file.delete())
    await del(path.join(this.distDirectory, `/**/!(index).js`))
    return this
  }

  private async bundle (): Promise<this> {
    try {
      const bundle = await rollup({
        input: path.join(this.distDirectory, 'main.js'),
        plugins: [
          ...(!this.waneCompilerOptions.pretty
            ? [
              rollupPluginUglify({
                compress: {
                  // passes: 2,
                  keep_fargs: false,
                },
                mangle: {
                  toplevel: true,
                  properties: {
                    // reserved: require('uglify-es/tools/domprops'),
                    regex: /^__wane__/,
                  },
                },
                ecma: 8,
                toplevel: true,
              }),
            ]
            : []),
        ],
      })
      await bundle.write({
        format: 'es',
        file: path.join(this.distDirectory, 'index.js'),
      })
      return this
    } catch (error) {
      if (error.code == 'PARSE_ERROR') {
        const { loc: { file, line, column }, frame } = error
        const [dirname, filename] = [path.dirname(file), path.basename(file)]
        const formattedFile = path.join(dirname, chalk.bold(filename))
        console.error(chalk.red(`Error during bundling in ${formattedFile} (${line}:${column}).`))
        console.error(frame)
      } else {
        console.error(error)
      }
      throw error
    }
  }

}

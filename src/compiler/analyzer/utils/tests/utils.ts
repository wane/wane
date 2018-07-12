import Project, {ClassDeclaration} from 'ts-simple-ast'
import * as path from 'path'

export const loadClassFromFile = (filename: string) => (className: string, project = new Project()): ClassDeclaration => {
  const dir = path.join(__dirname.replace(`/dist/`, `/src/`), 'files')
  const file = path.join(dir, filename)
  project.addExistingSourceFile(file)
  const source = project.getSourceFile(file)!
  return source.getClassOrThrow(className)
}

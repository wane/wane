import { getProjectAnalyzer } from '../compiler/compile'
import * as path from 'path'
import { ProjectAnalyzer } from '../compiler/analyzer'

function getPathToTestApp (testAppName: string): string {
  return path.join(__dirname.replace('/dist/', '/src/'), 'apps', testAppName)
}

export const projectNames = [
  '01-hello-world',
  '02-counter',
  '03-toggler',
  '04-comparator',
  '05-deep-ifs',
  '06-hello-everyone',
  '07-scoreboard',
]

export const [
  helloWorld,
  counter,
  toggler,
  comparator,
  deepIfs,
  helloEveryone,
  scoreboard,
]: ProjectAnalyzer[] = projectNames.map(name => getProjectAnalyzer({ dir: getPathToTestApp(name) }))

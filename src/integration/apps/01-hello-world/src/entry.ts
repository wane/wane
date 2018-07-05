// @ts-ignore
import { Entry, Template } from 'wane'

@Entry()
@Template(`
  {{ greeting }}, {{ someone }}!
`)
export class App {
  private greeting: string = `Hello`
  private someone: string = `World`
}

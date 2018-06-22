// @ts-ignore
import { Entry, Template } from 'wane'

@Entry()
@Template(`
  {{ greeting }}, {{ someone }}!
`)
export class App {
  public greeting: string = `Hello`
  public someone: string = `World`
}

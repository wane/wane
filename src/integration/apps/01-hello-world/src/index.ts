// @ts-ignore
import { Template } from 'wane'

@Template(`
  {{ greeting }}, {{ someone }}!
`)
export default class App {
  private greeting: string = `Hello`
  private someone: string = `World`
}

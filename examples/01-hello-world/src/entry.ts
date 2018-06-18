import { Entry, Template } from 'wane'

@Entry()
@Template(`
  {{ greeting }}, {{ who }}!
`)
export class AppCmp {
  private greeting = `Hello`
  private who = `World`
}

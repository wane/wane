import { Entry, Template } from 'wane'

@Entry()
@Template(`
  {{ message }}
`)
export class HelloWorldCmp {
  private message = `Hello World!`
}

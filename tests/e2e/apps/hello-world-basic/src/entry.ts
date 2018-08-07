// @ts-ignore
import { Template } from 'wane'

@Template(`
  {{ message }}
`)
export default class HelloWorldCmp {
  private message = `Hello World!`
}
